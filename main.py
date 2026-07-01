"""
Cybersecurity News -> Khmer Translation -> Telegram Bot
---------------------------------------------------------
Pulls RSS feeds, translates title+summary to Khmer via Gemini,
posts to a Telegram channel. Includes a DRY_RUN mode for safe testing.

SETUP (before running):
    1. pip install feedparser requests google-genai beautifulsoup4 python-dotenv
    2. Create a .env file in this same folder (see .env.example) with:
           GEMINI_API_KEY=your_gemini_key
           TELEGRAM_BOT_TOKEN=your_bot_token
           TELEGRAM_CHANNEL_ID=your_channel_id
       .env is loaded automatically — no need to export vars manually,
       and it should NEVER be committed to git (see .gitignore).

TESTING FLOW:
    1. Keep DRY_RUN = True (default) to print translated messages instead
       of posting to Telegram. TELEGRAM_* vars aren't required for this step.
    2. Read through the printed Khmer output for a few articles to confirm
       translation quality.
    3. Once happy, set DRY_RUN = False and make sure TELEGRAM_BOT_TOKEN /
       TELEGRAM_CHANNEL_ID are in your .env to post for real.

RECOMMENDED SCHEDULE (once ready to automate):
    Run hourly, 6 AM - 9 PM, MAX_POSTS_PER_RUN = 5 (already set below).
    ~96 Gemini calls/day, well under GEMINI_DAILY_BUDGET (150).
    Crontab line:
        0 6-21 * * * cd /path/to/news-scraping && /usr/bin/python3 main.py >> news_bot.log 2>&1
"""

import feedparser
import requests
import json
import os
import time
from datetime import datetime
from bs4 import BeautifulSoup
from google import genai
from dotenv import load_dotenv

load_dotenv()  # reads variables from a local .env file, if present

# ─── CONFIG ────────────────────────────────────────────────
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

SEEN_FILE = "seen_articles.json"
MAX_POSTS_PER_RUN = 5
MAX_RETRIES = 3
RETRY_DELAY = 15
REQUEST_DELAY = 10
FEED_DELAY = 5

# gemini-2.0-flash was deprecated/retired in March 2026 — using a currently
# supported free-tier model instead. Check https://ai.google.dev/gemini-api/docs/models
# if you hit quota errors again in the future, in case this needs updating.
GEMINI_MODEL = "gemini-2.5-flash"

# Hard self-imposed daily cap on Gemini calls, tracked locally in USAGE_FILE.
# Keep this well under the real free-tier limit so you never get close to it,
# no matter how many times you run the script or schedule it via cron.
GEMINI_DAILY_BUDGET = 150
USAGE_FILE = "gemini_usage.json"

# --- TESTING SWITCHES ---
# Set DRY_RUN = True to print messages instead of sending to Telegram.
# Lower MAX_POSTS_PER_RUN while testing to avoid burning Gemini quota.
DRY_RUN = True

# --- BRANDING / MESSAGE STYLE (edit these to match your channel) ---
JOIN_TEXT = "JOIN us for cybersecurity awareness"
CYBER_AWARE_LABEL = "Cyber Aware:"
CYBER_AWARE_HANDLE = "@YourChannelHandle"
HASHTAGS = [
    "#SecuDemy",
    "#StaySafeOnlineCambodia",
    "#CyberYouthCambodia",
    "#ISACCambodia",
    "#DigitalEconomyKH",
]

# Set USE_GEMINI = False to skip translation entirely and post/print the
# original English title. Good for testing feeds + formatting +
# Telegram posting before wiring up Gemini at all.
USE_GEMINI = True

RSS_FEEDS = [
    # --- Top Cyber News ---
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.bleepingcomputer.com/feed/",
    "https://krebsonsecurity.com/feed/",
    "https://www.darkreading.com/rss.xml",
    "https://www.securityweek.com/feed",

    # --- Vulnerabilities & CVEs ---
    "https://isc.sans.edu/rssfeed.xml",
    "https://www.cisa.gov/cybersecurity-advisories/all.xml",

    # --- Threat Intelligence ---
    "https://www.malwarebytes.com/blog/feed/",
    "https://blog.talosintelligence.com/feeds/posts/default",
    "https://research.checkpoint.com/feed/",

    # --- General Security ---
    "https://www.troyhunt.com/rss/",
]

client = None
if USE_GEMINI and GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


# ─── SEEN ARTICLES ────────────────────────────────────────
def load_seen():
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(json.load(f))
    return set()


def save_seen(seen):
    with open(SEEN_FILE, "w") as f:
        json.dump(list(seen), f)


# ─── GEMINI USAGE TRACKER (self-imposed safety net) ────────
def _today_str():
    return datetime.now().strftime("%Y-%m-%d")


def load_usage():
    if os.path.exists(USAGE_FILE):
        try:
            with open(USAGE_FILE) as f:
                data = json.load(f)
            if data.get("date") == _today_str():
                return data
        except (json.JSONDecodeError, OSError):
            pass
    return {"date": _today_str(), "count": 0}


def save_usage(usage):
    with open(USAGE_FILE, "w") as f:
        json.dump(usage, f)


def can_use_gemini(usage):
    """Returns True if we're still under today's self-imposed budget."""
    if usage["count"] >= GEMINI_DAILY_BUDGET:
        print(f"[STOP] Reached self-imposed daily Gemini budget "
              f"({GEMINI_DAILY_BUDGET} calls). Skipping translation for the rest of today.")
        return False
    return True


def record_gemini_call(usage):
    usage["count"] += 1
    save_usage(usage)
    print(f"[INFO] Gemini calls used today: {usage['count']}/{GEMINI_DAILY_BUDGET}")


# ─── FEED HEALTH CHECK (no API cost, run this first) ──────
def check_feeds():
    """Quickly check which feeds are alive and how many entries each has.
    Costs nothing — no Gemini or Telegram calls. Run this before a real test."""
    print("=== FEED HEALTH CHECK ===")
    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            status = getattr(feed, "status", "?")
            title = feed.feed.get("title", "N/A")
            print(f"[{status}] {len(feed.entries):>3} entries | {title:<30} | {url}")
        except Exception as e:
            print(f"[ERR] {url} -> {e}")
    print("=== END FEED CHECK ===\n")


# ─── QUOTA CHECK (only call when we actually have new articles) ──
def check_quota():
    try:
        client.models.generate_content(
            model=GEMINI_MODEL,
            contents="Hi"
        )
        print("[OK] Gemini quota available.")
        return True
    except Exception as e:
        error_str = str(e)
        if "RESOURCE_EXHAUSTED" in error_str:
            print("[WARN] Gemini daily quota exhausted. Try again tomorrow.")
        elif "429" in error_str:
            print("[WARN] Gemini rate limited. Wait a few minutes and try again.")
        else:
            print(f"[ERROR] Gemini error: {e}")
        return False


# ─── CLEAN HTML FROM SUMMARIES ─────────────────────────────
def clean_html(raw_html):
    if not raw_html:
        return ""
    text = BeautifulSoup(raw_html, "html.parser").get_text(separator=" ")
    return " ".join(text.split())  # collapse whitespace


# ─── TRANSLATE WITH GEMINI (title + summary only) ─────────
def translate_with_gemini(title, summary):
    prompt = f"""Translate the following to Khmer language only. Return exactly 2 lines:
Line 1: translated title
Line 2: translated summary (2-3 short sentences, under 280 characters)

Do not include quotation marks, markdown, or any extra commentary.

Title: {title}
Summary: {summary}

Return only the 2 translated lines, nothing else."""

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            lines = response.text.strip().split("\n", 1)
            translated_title = lines[0].strip() if len(lines) > 0 else title
            translated_summary = lines[1].strip() if len(lines) > 1 else summary[:300]
            return translated_title, translated_summary

        except Exception as e:
            error_str = str(e)

            if "RESOURCE_EXHAUSTED" in error_str and "free_tier" in error_str:
                print("[ERROR] Gemini daily quota exceeded. Stopping.")
                return None, None

            elif "429" in error_str:
                wait = RETRY_DELAY * attempt
                print(f"[WARN] Rate limited (attempt {attempt}/{MAX_RETRIES}). Waiting {wait}s...")
                time.sleep(wait)

            else:
                print(f"[ERROR] Gemini unexpected error: {e}")
                break

    print("[WARN] Translation failed, using original text.")
    return title, summary[:300]


# ─── FORMAT MESSAGE ───────────────────────────────────────
def truncate_summary(text, limit=300):
    text = text.strip()
    if len(text) <= limit:
        return text
    # cut at the last space before the limit so we don't chop mid-word
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(",.;:") + "..."


def format_message(title, summary, link, source_name):
    hashtags_block = "\n".join(HASHTAGS)
    return (
        f"<b>{title}</b>\n\n"
        f"{summary}\n\n"
        f"Read more:\n{link}\n\n"
        f"* {JOIN_TEXT} *\n"
        f"----------------\n"
        f"{CYBER_AWARE_LABEL} {CYBER_AWARE_HANDLE}\n\n"
        f"{hashtags_block}"
    )


# ─── SEND TO TELEGRAM ─────────────────────────────────────
def send_to_telegram(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHANNEL_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }
    try:
        r = requests.post(url, json=payload, timeout=15)
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Telegram request failed: {e}")
        return False

    if not r.ok:
        print(f"[ERROR] Telegram: {r.status_code} - {r.text}")
        return False
    print("[OK] Telegram message sent.")
    return True


# ─── MAIN ─────────────────────────────────────────────────
def scrape_and_post():
    if USE_GEMINI and not GEMINI_API_KEY:
        print("[FATAL] GEMINI_API_KEY not set. Export it, or set USE_GEMINI = False.")
        return
    if not DRY_RUN and (not BOT_TOKEN or not CHANNEL_ID):
        print("[FATAL] TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID not set. Export them or enable DRY_RUN.")
        return

    seen = load_seen()
    usage = load_usage()
    new_count = 0
    quota_exceeded = False
    quota_checked = False

    for feed_url in RSS_FEEDS:
        if new_count >= MAX_POSTS_PER_RUN or quota_exceeded:
            break

        time.sleep(FEED_DELAY)

        try:
            feed = feedparser.parse(feed_url)
            source_name = feed.feed.get("title", feed_url)
            print(f"[INFO] Checking feed: {source_name}")

            for entry in feed.entries[:3]:
                if new_count >= MAX_POSTS_PER_RUN or quota_exceeded:
                    break

                link = entry.get("link", "")
                if not link or link in seen:
                    continue

                title = entry.get("title", "No title")
                raw_summary = entry.get("summary", "")
                summary = clean_html(raw_summary)[:500]

                if USE_GEMINI:
                    # Stop for the day if we've hit our self-imposed budget,
                    # regardless of what Google's real quota still allows.
                    if not can_use_gemini(usage):
                        quota_exceeded = True
                        break

                    # Only spend a Gemini quota-check call once we know there's
                    # actually something new to translate.
                    if not quota_checked:
                        if not check_quota():
                            return
                        record_gemini_call(usage)
                        quota_checked = True
                        time.sleep(REQUEST_DELAY)

                    print(f"[INFO] Translating: {title}")
                    final_title, final_summary = translate_with_gemini(title, summary)
                    record_gemini_call(usage)

                    if final_title is None:
                        quota_exceeded = True
                        break
                    final_summary = truncate_summary(final_summary, 300)
                else:
                    print(f"[INFO] Using original text (Gemini off): {title}")
                    final_title = title
                    final_summary = truncate_summary(summary, 300)

                message = format_message(final_title, final_summary, link, source_name)

                if DRY_RUN:
                    print("\n===== DRY RUN OUTPUT (not sent) =====")
                    print(message)
                    print("======================================\n")
                else:
                    send_to_telegram(message)

                seen.add(link)
                new_count += 1

                if USE_GEMINI:
                    print(f"[INFO] Waiting {REQUEST_DELAY}s before next request...")
                    time.sleep(REQUEST_DELAY)
                else:
                    time.sleep(1)  # tiny pause, just to be polite to feeds/Telegram

        except Exception as e:
            print(f"[ERROR] Feed {feed_url}: {e}")

    if not DRY_RUN:
        save_seen(seen)  # don't persist "seen" during dry runs, so real run isn't skipped

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Done. "
          f"{'(DRY RUN) ' if DRY_RUN else ''}Posted {new_count} article(s).")

    if quota_exceeded:
        print("[WARN] Gemini quota exhausted. Try again tomorrow.")
        print("       https://ai.google.dev/gemini-api/docs/rate-limits")

    if new_count == 0:
        print("[INFO] No new articles found — nothing to post today.")


if __name__ == "__main__":
    # Step 1: check feeds are alive (free, no API calls)
    check_feeds()

    # Step 2: run scrape+translate+post (respects DRY_RUN and MAX_POSTS_PER_RUN)
    scrape_and_post()