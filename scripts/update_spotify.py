"""Write the three newest Spotify releases to data/spotify.json.

Run by .github/workflows/update-feeds.yml. Needs SPOTIFY_CLIENT_ID and
SPOTIFY_CLIENT_SECRET (repo secrets from a Spotify developer app whose owner
has Premium). If Spotify refuses, the existing file is left as it was and a
warning shows on the workflow run. Standard library only.
"""
import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request

ARTIST_ID = "3OGoSdHCFrG0wLdROotkfY"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "spotify.json")
COUNT = 3


def warn(msg):
    # Shows as a yellow warning on the Actions run instead of failing it.
    print("::warning::" + msg)


def get_token(client_id, secret):
    auth = base64.b64encode(f"{client_id}:{secret}".encode()).decode()
    req = urllib.request.Request(
        "https://accounts.spotify.com/api/token",
        data=urllib.parse.urlencode({"grant_type": "client_credentials"}).encode(),
        headers={"Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


def get_releases(token):
    url = (f"https://api.spotify.com/v1/artists/{ARTIST_ID}/albums?"
           + urllib.parse.urlencode({"include_groups": "album,single", "limit": 10}))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=30) as r:
        items = json.load(r).get("items", [])
    # release_date may be "2024", "2024-05" or "2024-05-17"; pad so they sort as strings.
    items.sort(key=lambda a: (a.get("release_date") or "").ljust(10, "0"), reverse=True)
    return [{
        "id": a["id"],
        "name": a.get("name"),
        "type": a.get("album_type"),
        "release_date": a.get("release_date"),
    } for a in items[:COUNT]]


def main():
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not secret:
        warn("Spotify secrets not set — skipping Spotify update.")
        return
    try:
        releases = get_releases(get_token(client_id, secret))
    except urllib.error.HTTPError as e:
        warn(f"Spotify said {e.code}: {e.read().decode(errors='replace')[:300]}")
        return
    except Exception as e:
        warn(f"Spotify update failed: {e}")
        return
    if not releases:
        warn("Spotify returned no releases — leaving the existing file untouched.")
        return

    data = {"releases": releases}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            if json.load(f) == data:
                print("No change.")
                return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("Updated:", json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
