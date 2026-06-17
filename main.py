import feedparser
import requests
import json
import os
import schedule
import time
from datetime import datetime

BOT_TOKEN = "8230364770:AAHHo8PQayR3hje3AzzAILhKGcjxYLPjIcU"
CHANNEL_ID = "-1003474021131"  # or numeric ID like -1001234567890
SEEN_FILE = "seen_articles.json"

# --- Cyber news RSS sources ---
RSS_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.bleepingcomputer.com/feed/",
    "https://krebsonsecurity.com/feed/",
    "https://www.darkreading.com/rss.xml",
    "https://www.securityweek.com/feed",
    "https://threatpost.com/feed/",
]

def load_seen():
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(json.load(f))
    return set()

def save_seen(seen):
    with open(SEEN_FILE, "w") as f:
        json.dump(list(seen), f)

def send_to_telegram(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHANNEL_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }
    r = requests.post(url, json=payload)
    if not r.ok:
        print(f"[ERROR] Telegram: {r.text}")

def format_message(entry, source_name):
    title = entry.get("title", "No title")
    link = entry.get("link", "")
    summary = entry.get("summary", "")[:300]  # truncate
    published = entry.get("published", "")

    return (
        f"🔐 <b>{title}</b>\n\n"
        f"{summary}...\n\n"
        f"🔗 <a href='{link}'>Read more</a>\n"
        f"📰 {source_name} | {published}"
    )

def scrape_and_post():
    seen = load_seen()
    new_count = 0

    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            source_name = feed.feed.get("title", feed_url)

            for entry in feed.entries[:5]:  # check latest 5 per feed
                link = entry.get("link", "")
                if not link or link in seen:
                    continue

                message = format_message(entry, source_name)
                send_to_telegram(message)
                seen.add(link)
                new_count += 1
                time.sleep(2)  # avoid hitting rate limits

        except Exception as e:
            print(f"[ERROR] {feed_url}: {e}")

    save_seen(seen)
    print(f"[{datetime.now()}] Posted {new_count} new articles.")

# --- Run immediately, then every 30 minutes ---
scrape_and_post()
schedule.every(30).minutes.do(scrape_and_post)

while True:
    schedule.run_pending()
    time.sleep(1)