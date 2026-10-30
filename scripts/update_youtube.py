"""Write the newest YouTube video and Short to data/youtube.json.

Run by .github/workflows/update-youtube.yml on a schedule. Uses YouTube's
public RSS feeds, so no API key is needed. Standard library only.
"""
import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UC_KronLt3Lr6QXPFJktc8fQ"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "youtube.json")
FEED = "https://www.youtube.com/feeds/videos.xml?"
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
UA = {"User-Agent": "Mozilla/5.0 (tzeke000.github.io feed updater)"}


def fetch_entries(query):
    req = urllib.request.Request(FEED + query, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    out = []
    for e in root.findall("a:entry", NS):
        out.append({
            "id": e.findtext("yt:videoId", namespaces=NS),
            "title": e.findtext("a:title", namespaces=NS),
            "published": e.findtext("a:published", namespaces=NS),
        })
    return [v for v in out if v["id"]]


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def is_short(video_id):
    # /shorts/<id> answers 200 for a Short and redirects to /watch for anything else.
    opener = urllib.request.build_opener(_NoRedirect)
    req = urllib.request.Request("https://www.youtube.com/shorts/" + video_id, headers=UA, method="HEAD")
    try:
        return opener.open(req, timeout=20).status == 200
    except urllib.error.HTTPError:
        return False


def main():
    suffix = CHANNEL_ID[2:]
    video = short = None
    # Preferred: YouTube's built-in "long videos only" (UULF) and "Shorts only" (UUSH) upload lists.
    try:
        videos = fetch_entries("playlist_id=UULF" + suffix)
        video = videos[0] if videos else None
    except Exception as e:
        print("long-video feed failed:", e)
    try:
        shorts = fetch_entries("playlist_id=UUSH" + suffix)
        short = shorts[0] if shorts else None
    except Exception as e:
        print("shorts feed failed:", e)

    # Fallback: the whole-channel feed, sorted by checking each upload's /shorts/ URL.
    if video is None or short is None:
        for v in fetch_entries("channel_id=" + CHANNEL_ID):
            if video and short:
                break
            if is_short(v["id"]):
                short = short or v
            else:
                video = video or v

    if video is None and short is None:
        sys.exit("No uploads found — leaving the existing file untouched.")

    data = {"video": video, "short": short}
    old = None
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f)
    if old == data:
        print("No change.")
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("Updated:", json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
