import os
import urllib.request
import ssl

ssl_context = ssl._create_unverified_context()
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

DOWNLOADS = {
    # Hotels
    r"frontend\public\hotels\irctc-retiring-room.jpg": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80",
    r"frontend\public\hotels\station-pod-hotel.jpg": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80",
    r"frontend\public\hotels\ginger-transit-hotel.jpg": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80",
    r"frontend\public\hotels\taj-connemara.jpg": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80",
    r"frontend\public\hotels\residency-towers.jpg": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000&q=80",
    r"frontend\public\hotels\itc-grand-chola.jpg": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1000&q=80",
    r"frontend\public\hotels\heritage-madurai.jpg": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=80",
    r"frontend\public\hotels\coimbatore-residency.jpg": "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1000&q=80",

    # Trains
    r"frontend\public\trains\vande-bharat-express.jpg": "https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=1000&q=80",
    r"frontend\public\trains\rajdhani-express.jpg": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1000&q=80",
    r"frontend\public\trains\tejas-express.jpg": "https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=1000&q=80",
    r"frontend\public\trains\wap7-loco.jpg": "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=1000&q=80",
    r"frontend\public\trains\vande-bharat-interior.jpg": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80",
    r"frontend\public\trains\sleeper-coach-interior.jpg": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1000&q=80",

    # Specific Groceries
    r"frontend\public\grocery\colgate-kit.jpg": "https://images.unsplash.com/photo-1559591937-e160a0f4c3a2?w=800&q=80",
    r"frontend\public\grocery\cold-coffee.jpg": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80",
    r"frontend\public\grocery\fruit-juice.jpg": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80",
    r"frontend\public\grocery\neck-pillow.jpg": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80",
    r"frontend\public\grocery\travel-kit.jpg": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
}

base_dir = r"C:\Users\Administrator\.gemini\antigravity\scratch\RailResQ"

print(f"Starting asset download of {len(DOWNLOADS)} real images...")
for rel_path, url in DOWNLOADS.items():
    dest_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ssl_context, timeout=15) as resp:
            data = resp.read()
            with open(dest_path, "wb") as f:
                f.write(data)
        print(f"[OK] Downloaded: {rel_path} ({len(data)} bytes)")
    except Exception as e:
        print(f"[ERR] Failed {rel_path}: {e}")

print("Download script complete!")
