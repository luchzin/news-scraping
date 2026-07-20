"""
Cybersecurity News -> Telegram Bot (Khmer + English translation)
------------------------------------------------------------------
Pulls RSS feeds. English title/summary come straight from the feed
(no Gemini needed for that). Gemini is used ONLY to produce a Khmer
translation, which is posted ABOVE the English original.
Includes a DRY_RUN mode for safe testing.

SETUP (before running):
    1. pip install feedparser requests google-genai beautifulsoup4 python-dotenv
    2. Create a .env file in this same folder (see .env.example) with:
           GEMINI_API_KEY=your_gemini_key
           BOT_TOKEN=your_bot_token
           CHANNEL_ID=your_channel_id
       .env is loaded automatically — no need to export vars manually,
       and it should NEVER be committed to git (see .gitignore).

TESTING FLOW:
    1. Keep DRY_RUN = True (default) to print messages instead of
       posting to Telegram. BOT_TOKEN/CHANNEL_ID aren't required for this.
    2. Read through the printed output for a few articles to confirm
       the Khmer translation reads naturally.
    3. Once happy, set DRY_RUN = False and make sure BOT_TOKEN /
       CHANNEL_ID are set to post for real.

RECOMMENDED SCHEDULE (once ready to automate):
    Run hourly, 6 AM - 9 PM, MAX_POSTS_PER_RUN = 5 (already set below).
    ~96 Gemini calls/day, well under GEMINI_DAILY_BUDGET (150).

IMPORTANT — Khmer guarantee:
    With USE_GEMINI = True (the normal/production setting), a post is
    NEVER sent without its Khmer translation. If Gemini fails for an
    article (rate limit, bad response) or the daily budget/quota is
    exhausted, that article is skipped for this run and left "unseen"
    so it gets retried automatically on a later run — it is never
    posted English-only.
    The ONLY way to get English-only posts is to explicitly set
    USE_GEMINI = False below (intended for testing feeds/formatting
    only). The script now prints a loud warning at startup whenever
    USE_GEMINI is False, so this can't happen by accident.
"""

import feedparser
import requests
import json
import os
import sys
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

GEMINI_MODEL = "gemini-2.5-flash"

# Hard self-imposed daily cap on Gemini calls, tracked locally in USAGE_FILE.
GEMINI_DAILY_BUDGET = 150
USAGE_FILE = "gemini_usage.json"

# --- TESTING SWITCHES ---
DRY_RUN = False

# --- BRANDING / MESSAGE STYLE (edit these to match your channel) ---
JOIN_TEXT = "JOIN us for cybersecurity news"
CYBER_AWARE_LABEL = "Cyber News:"
CYBER_AWARE_HANDLE = "https://t.me/CambodiaCybersecurityHub"
HASHTAGS = [
    "#SecuDemy",
    "#StaySafeOnlineCambodia",
    "#CyberYouthCambodia",
    "#ISACCambodia",
    "#DigitalEconomyKH",
]

# Gemini is only used for the Khmer translation now — English is never
# sent to Gemini at all. Set to False to skip Khmer entirely and post
# English-only (useful for testing feeds/formatting/Telegram first).
# NOTE: leaving this False in a live/scheduled run means EVERY post will
# be English-only. A startup warning below makes this hard to miss.
USE_GEMINI = True

RSS_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.bleepingcomputer.com/feed/",
    "https://krebsonsecurity.com/feed/",
    "https://www.darkreading.com/rss.xml",
    "https://www.securityweek.com/feed",
    "https://isc.sans.edu/rssfeed.xml",
    "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    "https://www.malwarebytes.com/blog/feed/",
    "https://blog.talosintelligence.com/feeds/posts/default",
    "https://research.checkpoint.com/feed/",
    "https://www.troyhunt.com/rss/",
]

client = None
if USE_GEMINI and GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


# ─── STARTUP SAFETY CHECKS ─────────────────────────────────
def startup_checks():
    """Loud, hard-to-miss warnings for config states that change posting
    behavior in a way that's easy to forget about."""
    print("=" * 60)
    if not USE_GEMINI:
        print("[!!!] USE_GEMINI = False")
        print("[!!!] EVERY post from this run will be ENGLISH-ONLY.")
        print("[!!!] No Khmer translation will be attempted at all.")
        print("[!!!] This is intended for testing feeds/formatting only.")
        print("[!!!] Set USE_GEMINI = True for normal/production runs.")
    elif not GEMINI_API_KEY:
        print("[!!!] USE_GEMINI = True but GEMINI_API_KEY is missing.")
        print("[!!!] Gemini calls will fail immediately, and per the")
        print("[!!!] skip-on-failure logic, NOTHING will be posted at all")
        print("[!!!] until a valid key is set in your .env file.")
    else:
        print("[OK] USE_GEMINI = True and GEMINI_API_KEY is set.")
        print("[OK] Posts will include Khmer + English, or be skipped")
        print("[OK] (and retried later) if translation isn't available.")

    if DRY_RUN:
        print("[INFO] DRY_RUN = True — messages will be printed, not sent to Telegram.")
    else:
        print("[INFO] DRY_RUN = False — messages WILL be posted to Telegram.")
        if not BOT_TOKEN or not CHANNEL_ID:
            print("[!!!] BOT_TOKEN / CHANNEL_ID not set — posting will fail.")
    print("=" * 60 + "\n")


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
    if usage["count"] >= GEMINI_DAILY_BUDGET:
        print(f"[STOP] Reached self-imposed daily Gemini budget "
              f"({GEMINI_DAILY_BUDGET} calls). Skipping translation for the rest of today.")
        return False
    return True


def record_gemini_call(usage):
    usage["count"] += 1
    save_usage(usage)
    print(f"[INFO] Gemini calls used today: {usage['count']}/{GEMINI_DAILY_BUDGET}")


# ─── FEED HEALTH CHECK ─────────────────────────────────────
def check_feeds():
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


# ─── QUOTA CHECK ────────────────────────────────────────────
def check_quota():
    try:
        client.models.generate_content(model=GEMINI_MODEL, contents="Hi")
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
    return " ".join(text.split())


# ─── TRANSLATE WITH GEMINI (Khmer only — English is never sent here) ──
def translate_to_khmer(title, summary):
    prompt = f"""Translate the following to Khmer language only. Return exactly 2 lines:
Line 1: translated title
Line 2: translated summary (2-3 short sentences, under 280 characters)

Translate naturally and idiomatically, the way a native Khmer speaker
would phrase it — avoid overly literal, word-for-word translation.

Do not include quotation marks, markdown, or any extra commentary.

Title: {title}
Summary: {summary}

Return only the 2 translated lines, nothing else."""

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            lines = response.text.strip().split("\n", 1)
            kh_title = lines[0].strip() if len(lines) > 0 else ""
            kh_summary = lines[1].strip() if len(lines) > 1 else ""
            return kh_title, kh_summary
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

    print("[WARN] Khmer translation failed for this article — posting English only.")
    return "", ""


# ─── FORMAT MESSAGE (Khmer block first, English block second) ─────
def truncate_summary(text, limit=300):
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(",.;:") + "..."


def format_message(en_title, en_summary, kh_title, kh_summary, link, source_name):
    hashtags_block = "\n".join(HASHTAGS)

    # Khmer block (only included if translation succeeded)
    kh_block = ""
    if kh_title or kh_summary:
        kh_block = (
            f"<b>{kh_title}</b>\n\n"
            f"{kh_summary}\n\n"
            f"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n"
        )

    # English block
    en_block = (
        f"<b>{en_title}</b>\n\n"
        f"{en_summary}"
    )

    return (
        f"{kh_block}"
        f"{en_block}\n\n"
        f"Read more:\n{link}\n\n"
        f"* {JOIN_TEXT} *\n"
        f"{CYBER_AWARE_LABEL} {CYBER_AWARE_HANDLE}\n\n"
        f"{hashtags_block}"
    )


# ─── SEND TO TELEGRAM ─────────────────────────────────────
def send_to_telegram(text, preview_url=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHANNEL_ID,
        "text": text,
        "parse_mode": "HTML",
    }

    if preview_url:
        # Show a preview, but pin it to the news article link specifically —
        # not whichever URL happens to appear first (e.g. the channel handle).
        payload["link_preview_options"] = {
            "is_disabled": False,
            "url": preview_url,
            "prefer_large_media": True,
        }
    else:
        payload["link_preview_options"] = {"is_disabled": True}
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
    if not DRY_RUN and (not BOT_TOKEN or not CHANNEL_ID):
        print("[FATAL] BOT_TOKEN / CHANNEL_ID not set. Set them or enable DRY_RUN.")
        return 0

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

                # English comes straight from the RSS feed — no Gemini involved.
                en_title = entry.get("title", "No title")
                raw_summary = entry.get("summary", "")
                en_summary = truncate_summary(clean_html(raw_summary)[:500], 300)

                kh_title, kh_summary = "", ""
                translation_failed = False

                if USE_GEMINI:
                    if not can_use_gemini(usage):
                        quota_exceeded = True
                    else:
                        if not quota_checked:
                            if not check_quota():
                                return 0
                            record_gemini_call(usage)
                            quota_checked = True
                            time.sleep(REQUEST_DELAY)

                        print(f"[INFO] Translating to Khmer: {en_title}")
                        kh_title, kh_summary = translate_to_khmer(en_title, en_summary)
                        record_gemini_call(usage)

                        if kh_title is None:
                            # Real quota exhaustion (not just a failed single translation)
                            quota_exceeded = True
                            kh_title, kh_summary = "", ""
                        elif not kh_title and not kh_summary:
                            # Translation attempt failed (rate limit / bad response) but
                            # quota isn't necessarily exhausted — skip just this article.
                            translation_failed = True
                        else:
                            kh_summary = truncate_summary(kh_summary, 300)

                if quota_exceeded:
                    # Leave it unseen so it's retried once quota is available again.
                    print(f"[WARN] Skipping post — no Gemini quota available: {en_title}")
                    continue

                if translation_failed:
                    # Per requirement: never post English-only. Leave it unseen so
                    # it's retried on a later run.
                    print(f"[WARN] Skipping post — Khmer translation failed: {en_title}")
                    time.sleep(REQUEST_DELAY)
                    continue

                message = format_message(en_title, en_summary, kh_title, kh_summary, link, source_name)

                if DRY_RUN:
                    print("\n===== DRY RUN OUTPUT (not sent) =====")
                    print(message)
                    print("======================================\n")
                else:
                    send_to_telegram(message, preview_url=link)

                seen.add(link)
                new_count += 1

                if USE_GEMINI:
                    print(f"[INFO] Waiting {REQUEST_DELAY}s before next request...")
                    time.sleep(REQUEST_DELAY)
                else:
                    time.sleep(1)

        except Exception as e:
            print(f"[ERROR] Feed {feed_url}: {e}")

    if not DRY_RUN:
        save_seen(seen)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Done. "
          f"{'(DRY RUN) ' if DRY_RUN else ''}Posted {new_count} article(s).")

    if quota_exceeded:
        print("[WARN] Gemini quota exhausted or budget reached. Remaining articles were skipped and will be retried later.")

    if new_count == 0:
        print("[INFO] No new articles found — nothing to post today.")

    return new_count


if __name__ == "__main__":
    startup_checks()
    check_feeds()
    scrape_and_post()
