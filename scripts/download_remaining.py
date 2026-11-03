import os
import urllib.request
import ssl

ssl_context = ssl._create_unverified_context()
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

DOWNLOADS = {
    r"frontend\public\trains\wap7-loco.jpg": "https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=1000&q=80",
    r"frontend\public\grocery\colgate-kit.jpg": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
}

base_dir = r"C:\Users\Administrator\.gemini\antigravity\scratch\RailResQ"

for rel_path, url in DOWNLOADS.items():
    dest_path = os.path.join(base_dir, rel_path)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ssl_context, timeout=15) as resp:
            data = resp.read()
            with open(dest_path, "wb") as f:
                f.write(data)
        print(f"[OK] Downloaded: {rel_path} ({len(data)} bytes)")
    except Exception as e:
        print(f"[ERR] Failed {rel_path}: {e}")
