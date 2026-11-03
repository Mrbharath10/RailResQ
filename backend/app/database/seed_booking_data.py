import json
import random
import datetime
from sqlalchemy.orm import Session
from app.models.entities import Station
from app.models.booking_entities import TrainCatalog, SeatInventory, Booking, BookingPassenger, PaymentRecord


def seed_booking_system(db: Session):
    """
    Seeds comprehensive simulated railway data:
    - 28+ Railway Stations across South, West, North, East corridors
    - 35+ Realistic Mock Trains (Pandian, Vaigai, Cheran, Kovai, Tejas, Vande Bharat, Shatabdi, Rajdhani, Charminar, etc.)
    - Class-wise Seat Inventories (1A, 2A, 3A, SL, CC, EC, 2S)
    - Realistic Sample Bookings with 10-digit Demo PNRs
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    today_str = datetime.date.today().isoformat()

    # 1. Seed Comprehensive Stations (Ensure 28 Stations exist)
    stations_data = [
        {"code": "MAS", "name": "Chennai Central (Dr. MGR Central)", "division": "Chennai", "lat": 13.0827, "lng": 80.2707},
        {"code": "MS", "name": "Chennai Egmore", "division": "Chennai", "lat": 13.0782, "lng": 80.2608},
        {"code": "TBM", "name": "Tambaram (Chennai)", "division": "Chennai", "lat": 12.9249, "lng": 80.1000},
        {"code": "CGL", "name": "Chengalpattu Junction", "division": "Chennai", "lat": 12.6841, "lng": 79.9836},
        {"code": "VM", "name": "Villupuram Junction", "division": "Tiruchchirappalli", "lat": 11.9398, "lng": 79.4984},
        {"code": "TPJ", "name": "Tiruchchirappalli Junction (Trichy)", "division": "Tiruchchirappalli", "lat": 10.7942, "lng": 78.6856},
        {"code": "DG", "name": "Dindigul Junction", "division": "Madurai", "lat": 10.3624, "lng": 77.9695},
        {"code": "MDU", "name": "Madurai Junction", "division": "Madurai", "lat": 9.9174, "lng": 78.1130},
        {"code": "TEN", "name": "Tirunelveli Junction", "division": "Madurai", "lat": 8.7291, "lng": 77.7126},
        {"code": "AJJ", "name": "Arakkonam Junction", "division": "Chennai", "lat": 13.0788, "lng": 79.6677},
        {"code": "KPD", "name": "Katpadi Junction (Vellore)", "division": "Chennai", "lat": 12.9702, "lng": 79.1360},
        {"code": "JTJ", "name": "Jolarpettai Junction", "division": "Chennai", "lat": 12.5857, "lng": 78.5833},
        {"code": "SA", "name": "Salem Junction", "division": "Salem", "lat": 11.6643, "lng": 78.1460},
        {"code": "ED", "name": "Erode Junction", "division": "Salem", "lat": 11.3410, "lng": 77.7172},
        {"code": "TUP", "name": "Tiruppur", "division": "Salem", "lat": 11.1085, "lng": 77.3411},
        {"code": "CBE", "name": "Coimbatore Junction", "division": "Salem", "lat": 11.0016, "lng": 76.9668},
        {"code": "SBC", "name": "KSR Bengaluru City Junction", "division": "Bengaluru", "lat": 12.9781, "lng": 77.5696},
        {"code": "KJM", "name": "Krishnarajapuram (Bengaluru)", "division": "Bengaluru", "lat": 12.9972, "lng": 77.6789},
        {"code": "HYB", "name": "Hyderabad Deccan (Nampally)", "division": "Secunderabad", "lat": 17.3922, "lng": 78.4682},
        {"code": "CSMT", "name": "Mumbai Chhatrapati Shivaji Maharaj Terminus", "division": "Mumbai", "lat": 18.9401, "lng": 72.8355},
        {"code": "NDLS", "name": "New Delhi Railway Station", "division": "Delhi", "lat": 28.6415, "lng": 77.2185},
        {"code": "CNB", "name": "Kanpur Central", "division": "Prayagraj", "lat": 26.4547, "lng": 80.3507},
        {"code": "PRYJ", "name": "Prayagraj Junction", "division": "Prayagraj", "lat": 25.4484, "lng": 81.8333},
        {"code": "HWH", "name": "Howrah Junction (Kolkata)", "division": "Howrah", "lat": 22.5838, "lng": 88.3426},
        {"code": "BPL", "name": "Bhopal Junction", "division": "Bhopal", "lat": 23.2684, "lng": 77.4111},
        {"code": "BZA", "name": "Vijayawada Junction", "division": "Vijayawada", "lat": 16.5183, "lng": 80.6192},
        {"code": "VSKP", "name": "Visakhapatnam Junction", "division": "Waltair", "lat": 17.7215, "lng": 83.2882},
        {"code": "MAO", "name": "Madgaon Junction (Goa)", "division": "Konkan", "lat": 15.2736, "lng": 73.9583}
    ]

    for st in stations_data:
        existing = db.query(Station).filter(Station.station_code == st["code"]).first()
        if not existing:
            new_st = Station(
                station_code=st["code"],
                station_name=st["name"],
                division=st["division"],
                latitude=st["lat"],
                longitude=st["lng"],
                has_medical_facility=True,
                has_fire_support=True,
                is_active=True
            )
            db.add(new_st)
        else:
            existing.station_name = st["name"]
    db.commit()

    # 2. Seed 35+ Realistic Trains
    trains_seed = [
        # --- CHENNAI <-> MADURAI (Tamil Nadu Trunk) ---
        {
            "train_number": "12637",
            "train_name": "Pandian Superfast Express",
            "train_type": "Superfast",
            "source": "MS", "source_name": "Chennai Egmore",
            "dest": "MDU", "dest_name": "Madurai Junction",
            "dep": "21:40", "arr": "05:35", "duration": "7h 55m", "distance": 497.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 1820.0, "base_fare_2a": 1085.0, "base_fare_3a": 765.0, "base_fare_sl": 295.0,
            "route": [
                {"code": "MS", "name": "Chennai Egmore", "arr": "Source", "dep": "21:40", "day": 1, "platform": "4"},
                {"code": "TBM", "name": "Tambaram", "arr": "22:08", "dep": "22:10", "day": 1, "platform": "8"},
                {"code": "CGL", "name": "Chengalpattu Jn", "arr": "22:38", "dep": "22:40", "day": 1, "platform": "6"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "00:05", "dep": "00:10", "day": 2, "platform": "1"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "02:35", "dep": "02:40", "day": 2, "platform": "2"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "03:52", "dep": "03:55", "day": 2, "platform": "3"},
                {"code": "MDU", "name": "Madurai Junction", "arr": "05:35", "dep": "Destination", "day": 2, "platform": "1"}
            ]
        },
        {
            "train_number": "12638",
            "train_name": "Pandian Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "MDU", "source_name": "Madurai Junction",
            "dest": "MS", "dest_name": "Chennai Egmore",
            "dep": "21:20", "arr": "05:15", "duration": "7h 55m", "distance": 497.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 1820.0, "base_fare_2a": 1085.0, "base_fare_3a": 765.0, "base_fare_sl": 295.0,
            "route": [
                {"code": "MDU", "name": "Madurai Junction", "arr": "Source", "dep": "21:20", "day": 1, "platform": "1"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "22:12", "dep": "22:15", "day": 1, "platform": "2"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "23:35", "dep": "23:40", "day": 1, "platform": "3"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "02:10", "dep": "02:15", "day": 2, "platform": "1"},
                {"code": "CGL", "name": "Chengalpattu Jn", "arr": "03:43", "dep": "03:45", "day": 2, "platform": "5"},
                {"code": "TBM", "name": "Tambaram", "arr": "04:13", "dep": "04:15", "day": 2, "platform": "7"},
                {"code": "MS", "name": "Chennai Egmore", "arr": "05:15", "dep": "Destination", "day": 2, "platform": "4"}
            ]
        },
        {
            "train_number": "12635",
            "train_name": "Vaigai Superfast Express",
            "train_type": "Superfast",
            "source": "MS", "source_name": "Chennai Egmore",
            "dest": "MDU", "dest_name": "Madurai Junction",
            "dep": "13:50", "arr": "21:15", "duration": "7h 25m", "distance": 497.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 645.0, "base_fare_2s": 180.0,
            "route": [
                {"code": "MS", "name": "Chennai Egmore", "arr": "Source", "dep": "13:50", "day": 1, "platform": "4"},
                {"code": "TBM", "name": "Tambaram", "arr": "14:18", "dep": "14:20", "day": 1, "platform": "8"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "16:00", "dep": "16:05", "day": 1, "platform": "1"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "18:30", "dep": "18:35", "day": 1, "platform": "2"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "19:48", "dep": "19:50", "day": 1, "platform": "3"},
                {"code": "MDU", "name": "Madurai Junction", "arr": "21:15", "dep": "Destination", "day": 1, "platform": "2"}
            ]
        },
        {
            "train_number": "12636",
            "train_name": "Vaigai Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "MDU", "source_name": "Madurai Junction",
            "dest": "MS", "dest_name": "Chennai Egmore",
            "dep": "07:10", "arr": "14:30", "duration": "7h 20m", "distance": 497.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 645.0, "base_fare_2s": 180.0,
            "route": [
                {"code": "MDU", "name": "Madurai Junction", "arr": "Source", "dep": "07:10", "day": 1, "platform": "2"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "08:03", "dep": "08:05", "day": 1, "platform": "3"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "09:15", "dep": "09:20", "day": 1, "platform": "1"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "11:40", "dep": "11:45", "day": 1, "platform": "1"},
                {"code": "TBM", "name": "Tambaram", "arr": "13:38", "dep": "13:40", "day": 1, "platform": "7"},
                {"code": "MS", "name": "Chennai Egmore", "arr": "14:30", "dep": "Destination", "day": 1, "platform": "4"}
            ]
        },
        {
            "train_number": "22671",
            "train_name": "Tejas Express (MS - MDU)",
            "train_type": "Tejas",
            "source": "MS", "source_name": "Chennai Egmore",
            "dest": "MDU", "dest_name": "Madurai Junction",
            "dep": "06:00", "arr": "12:15", "duration": "6h 15m", "distance": 497.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1120.0, "base_fare_ec": 2180.0,
            "route": [
                {"code": "MS", "name": "Chennai Egmore", "arr": "Source", "dep": "06:00", "day": 1, "platform": "7"},
                {"code": "TBM", "name": "Tambaram", "arr": "06:25", "dep": "06:27", "day": 1, "platform": "8"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "09:55", "dep": "10:00", "day": 1, "platform": "2"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "10:58", "dep": "11:00", "day": 1, "platform": "3"},
                {"code": "MDU", "name": "Madurai Junction", "arr": "12:15", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },
        {
            "train_number": "20635",
            "train_name": "Ananthapuri Vande Bharat Express",
            "train_type": "Vande Bharat",
            "source": "MS", "source_name": "Chennai Egmore",
            "dest": "MDU", "dest_name": "Madurai Junction",
            "dep": "14:50", "arr": "21:20", "duration": "6h 30m", "distance": 497.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1365.0, "base_fare_ec": 2490.0,
            "route": [
                {"code": "MS", "name": "Chennai Egmore", "arr": "Source", "dep": "14:50", "day": 1, "platform": "5"},
                {"code": "TBM", "name": "Tambaram", "arr": "15:13", "dep": "15:15", "day": 1, "platform": "8"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "16:40", "dep": "16:42", "day": 1, "platform": "1"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "18:50", "dep": "18:55", "day": 1, "platform": "3"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "19:55", "dep": "19:57", "day": 1, "platform": "2"},
                {"code": "MDU", "name": "Madurai Junction", "arr": "21:20", "dep": "Destination", "day": 1, "platform": "2"}
            ]
        },
        {
            "train_number": "20636",
            "train_name": "Ananthapuri Vande Bharat (Return)",
            "train_type": "Vande Bharat",
            "source": "MDU", "source_name": "Madurai Junction",
            "dest": "MS", "dest_name": "Chennai Egmore",
            "dep": "07:15", "arr": "13:50", "duration": "6h 35m", "distance": 497.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1365.0, "base_fare_ec": 2490.0,
            "route": [
                {"code": "MDU", "name": "Madurai Junction", "arr": "Source", "dep": "07:15", "day": 1, "platform": "2"},
                {"code": "DG", "name": "Dindigul Jn", "arr": "08:15", "dep": "08:17", "day": 1, "platform": "3"},
                {"code": "TPJ", "name": "Tiruchchirappalli Jn", "arr": "09:20", "dep": "09:25", "day": 1, "platform": "2"},
                {"code": "VM", "name": "Villupuram Jn", "arr": "11:30", "dep": "11:32", "day": 1, "platform": "1"},
                {"code": "TBM", "name": "Tambaram", "arr": "13:08", "dep": "13:10", "day": 1, "platform": "7"},
                {"code": "MS", "name": "Chennai Egmore", "arr": "13:50", "dep": "Destination", "day": 1, "platform": "5"}
            ]
        },

        # --- CHENNAI <-> COIMBATORE (West Corridor) ---
        {
            "train_number": "20643",
            "train_name": "Coimbatore Vande Bharat Express",
            "train_type": "Vande Bharat",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "CBE", "dest_name": "Coimbatore Junction",
            "dep": "14:15", "arr": "20:05", "duration": "5h 50m", "distance": 495.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1365.0, "base_fare_ec": 2490.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "14:15", "day": 1, "platform": "2A"},
                {"code": "SA", "name": "Salem Jn", "arr": "17:48", "dep": "17:50", "day": 1, "platform": "4"},
                {"code": "ED", "name": "Erode Jn", "arr": "18:32", "dep": "18:35", "day": 1, "platform": "2"},
                {"code": "TUP", "name": "Tiruppur", "arr": "19:13", "dep": "19:15", "day": 1, "platform": "1"},
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "20:05", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },
        {
            "train_number": "20644",
            "train_name": "Coimbatore - Chennai Vande Bharat",
            "train_type": "Vande Bharat",
            "source": "CBE", "source_name": "Coimbatore Junction",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "06:00", "arr": "11:50", "duration": "5h 50m", "distance": 495.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1365.0, "base_fare_ec": 2490.0,
            "route": [
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "Source", "dep": "06:00", "day": 1, "platform": "1"},
                {"code": "TUP", "name": "Tiruppur", "arr": "06:35", "dep": "06:37", "day": 1, "platform": "1"},
                {"code": "ED", "name": "Erode Jn", "arr": "07:12", "dep": "07:15", "day": 1, "platform": "1"},
                {"code": "SA", "name": "Salem Jn", "arr": "07:58", "dep": "08:00", "day": 1, "platform": "4"},
                {"code": "MAS", "name": "Chennai Central", "arr": "11:50", "dep": "Destination", "day": 1, "platform": "2A"}
            ]
        },
        {
            "train_number": "12675",
            "train_name": "Kovai Superfast Express",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "CBE", "dest_name": "Coimbatore Junction",
            "dep": "06:10", "arr": "14:05", "duration": "7h 55m", "distance": 495.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 645.0, "base_fare_2s": 180.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "06:10", "day": 1, "platform": "10"},
                {"code": "AJJ", "name": "Arakkonam Jn", "arr": "07:08", "dep": "07:10", "day": 1, "platform": "1"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "07:53", "dep": "07:55", "day": 1, "platform": "1"},
                {"code": "JTJ", "name": "Jolarpettai Jn", "arr": "09:08", "dep": "09:10", "day": 1, "platform": "2"},
                {"code": "SA", "name": "Salem Jn", "arr": "10:37", "dep": "10:40", "day": 1, "platform": "4"},
                {"code": "ED", "name": "Erode Jn", "arr": "11:35", "dep": "11:40", "day": 1, "platform": "2"},
                {"code": "TUP", "name": "Tiruppur", "arr": "12:28", "dep": "12:30", "day": 1, "platform": "1"},
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "14:05", "dep": "Destination", "day": 1, "platform": "3"}
            ]
        },
        {
            "train_number": "12676",
            "train_name": "Kovai Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "CBE", "source_name": "Coimbatore Junction",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "15:15", "arr": "23:05", "duration": "7h 50m", "distance": 495.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 645.0, "base_fare_2s": 180.0,
            "route": [
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "Source", "dep": "15:15", "day": 1, "platform": "3"},
                {"code": "TUP", "name": "Tiruppur", "arr": "15:58", "dep": "16:00", "day": 1, "platform": "1"},
                {"code": "ED", "name": "Erode Jn", "arr": "16:45", "dep": "16:50", "day": 1, "platform": "1"},
                {"code": "SA", "name": "Salem Jn", "arr": "17:42", "dep": "17:45", "day": 1, "platform": "4"},
                {"code": "JTJ", "name": "Jolarpettai Jn", "arr": "19:28", "dep": "19:30", "day": 1, "platform": "2"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "20:38", "dep": "20:40", "day": 1, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "23:05", "dep": "Destination", "day": 1, "platform": "10"}
            ]
        },
        {
            "train_number": "12673",
            "train_name": "Cheran Superfast Express",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "CBE", "dest_name": "Coimbatore Junction",
            "dep": "22:00", "arr": "06:00", "duration": "8h 00m", "distance": 495.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 1820.0, "base_fare_2a": 1085.0, "base_fare_3a": 765.0, "base_fare_sl": 295.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "22:00", "day": 1, "platform": "9"},
                {"code": "AJJ", "name": "Arakkonam Jn", "arr": "22:58", "dep": "23:00", "day": 1, "platform": "1"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "23:48", "dep": "23:50", "day": 1, "platform": "1"},
                {"code": "SA", "name": "Salem Jn", "arr": "02:47", "dep": "02:50", "day": 2, "platform": "4"},
                {"code": "ED", "name": "Erode Jn", "arr": "03:45", "dep": "03:50", "day": 2, "platform": "2"},
                {"code": "TUP", "name": "Tiruppur", "arr": "04:38", "dep": "04:40", "day": 2, "platform": "1"},
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "06:00", "dep": "Destination", "day": 2, "platform": "2"}
            ]
        },
        {
            "train_number": "12674",
            "train_name": "Cheran Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "CBE", "source_name": "Coimbatore Junction",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "22:50", "arr": "07:00", "duration": "8h 10m", "distance": 495.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 1820.0, "base_fare_2a": 1085.0, "base_fare_3a": 765.0, "base_fare_sl": 295.0,
            "route": [
                {"code": "CBE", "name": "Coimbatore Junction", "arr": "Source", "dep": "22:50", "day": 1, "platform": "2"},
                {"code": "TUP", "name": "Tiruppur", "arr": "23:33", "dep": "23:35", "day": 1, "platform": "1"},
                {"code": "ED", "name": "Erode Jn", "arr": "00:20", "dep": "00:25", "day": 2, "platform": "1"},
                {"code": "SA", "name": "Salem Jn", "arr": "01:17", "dep": "01:20", "day": 2, "platform": "4"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "04:28", "dep": "04:30", "day": 2, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "07:00", "dep": "Destination", "day": 2, "platform": "9"}
            ]
        },

        # --- CHENNAI <-> BENGALURU (High Density Metro Corridor) ---
        {
            "train_number": "20607",
            "train_name": "Vande Bharat Express (MAS - MYS via SBC)",
            "train_type": "Vande Bharat",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "SBC", "dest_name": "KSR Bengaluru",
            "dep": "05:50", "arr": "10:10", "duration": "4h 20m", "distance": 359.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 985.0, "base_fare_ec": 1920.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "05:50", "day": 1, "platform": "2A"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "07:13", "dep": "07:15", "day": 1, "platform": "1"},
                {"code": "KJM", "name": "Krishnarajapuram", "arr": "09:33", "dep": "09:35", "day": 1, "platform": "4"},
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "10:10", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },
        {
            "train_number": "20608",
            "train_name": "Bengaluru - Chennai Vande Bharat Express",
            "train_type": "Vande Bharat",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "14:50", "arr": "19:20", "duration": "4h 30m", "distance": 359.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 985.0, "base_fare_ec": 1920.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "14:50", "day": 1, "platform": "1"},
                {"code": "KJM", "name": "Krishnarajapuram", "arr": "15:08", "dep": "15:10", "day": 1, "platform": "2"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "17:33", "dep": "17:35", "day": 1, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "19:20", "dep": "Destination", "day": 1, "platform": "2A"}
            ]
        },
        {
            "train_number": "12007",
            "train_name": "Chennai - Mysuru Shatabdi Express",
            "train_type": "Shatabdi",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "SBC", "dest_name": "KSR Bengaluru",
            "dep": "06:00", "arr": "10:45", "duration": "4h 45m", "distance": 359.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 760.0, "base_fare_ec": 1550.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "06:00", "day": 1, "platform": "2"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "07:38", "dep": "07:40", "day": 1, "platform": "1"},
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "10:45", "dep": "Destination", "day": 1, "platform": "7"}
            ]
        },
        {
            "train_number": "12008",
            "train_name": "Bengaluru - Chennai Shatabdi Express",
            "train_type": "Shatabdi",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "16:25", "arr": "21:30", "duration": "5h 05m", "distance": 359.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 760.0, "base_fare_ec": 1550.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "16:25", "day": 1, "platform": "7"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "19:28", "dep": "19:30", "day": 1, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "21:30", "dep": "Destination", "day": 1, "platform": "2"}
            ]
        },
        {
            "train_number": "12639",
            "train_name": "Brindavan Superfast Express",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "SBC", "dest_name": "KSR Bengaluru",
            "dep": "07:40", "arr": "13:40", "duration": "6h 00m", "distance": 359.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 520.0, "base_fare_2s": 145.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "07:40", "day": 1, "platform": "8"},
                {"code": "AJJ", "name": "Arakkonam Jn", "arr": "08:33", "dep": "08:35", "day": 1, "platform": "1"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "09:18", "dep": "09:20", "day": 1, "platform": "1"},
                {"code": "JTJ", "name": "Jolarpettai Jn", "arr": "10:33", "dep": "10:35", "day": 1, "platform": "2"},
                {"code": "KJM", "name": "Krishnarajapuram", "arr": "12:48", "dep": "12:50", "day": 1, "platform": "4"},
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "13:40", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },
        {
            "train_number": "12640",
            "train_name": "Brindavan Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "15:10", "arr": "21:10", "duration": "6h 00m", "distance": 359.0,
            "classes": ["CC", "2S"],
            "base_fare_cc": 520.0, "base_fare_2s": 145.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "15:10", "day": 1, "platform": "1"},
                {"code": "KJM", "name": "Krishnarajapuram", "arr": "15:33", "dep": "15:35", "day": 1, "platform": "2"},
                {"code": "JTJ", "name": "Jolarpettai Jn", "arr": "17:53", "dep": "17:55", "day": 1, "platform": "2"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "19:08", "dep": "19:10", "day": 1, "platform": "2"},
                {"code": "AJJ", "name": "Arakkonam Jn", "arr": "19:58", "dep": "20:00", "day": 1, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "21:10", "dep": "Destination", "day": 1, "platform": "8"}
            ]
        },
        {
            "train_number": "12609",
            "train_name": "Chennai - KSR Bengaluru Superfast",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "SBC", "dest_name": "KSR Bengaluru",
            "dep": "13:35", "arr": "19:45", "duration": "6h 10m", "distance": 359.0,
            "classes": ["2S", "CC"],
            "base_fare_2s": 145.0, "base_fare_cc": 520.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "13:35", "day": 1, "platform": "6"},
                {"code": "AJJ", "name": "Arakkonam Jn", "arr": "14:28", "dep": "14:30", "day": 1, "platform": "1"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "15:18", "dep": "15:20", "day": 1, "platform": "1"},
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "19:45", "dep": "Destination", "day": 1, "platform": "5"}
            ]
        },
        {
            "train_number": "12610",
            "train_name": "Bengaluru - Chennai Intercity Superfast",
            "train_type": "Superfast",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "06:10", "arr": "12:30", "duration": "6h 20m", "distance": 359.0,
            "classes": ["2S", "CC"],
            "base_fare_2s": 145.0, "base_fare_cc": 520.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "06:10", "day": 1, "platform": "5"},
                {"code": "KPD", "name": "Katpadi Jn", "arr": "10:13", "dep": "10:15", "day": 1, "platform": "2"},
                {"code": "MAS", "name": "Chennai Central", "arr": "12:30", "dep": "Destination", "day": 1, "platform": "6"}
            ]
        },

        # --- CHENNAI <-> HYDERABAD ---
        {
            "train_number": "12759",
            "train_name": "Charminar Superfast Express",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "HYB", "dest_name": "Hyderabad Deccan",
            "dep": "18:20", "arr": "08:00", "duration": "13h 40m", "distance": 790.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 2680.0, "base_fare_2a": 1580.0, "base_fare_3a": 1120.0, "base_fare_sl": 415.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "18:20", "day": 1, "platform": "9"},
                {"code": "BZA", "name": "Vijayawada Jn", "arr": "00:45", "dep": "00:55", "day": 2, "platform": "7"},
                {"code": "HYB", "name": "Hyderabad Deccan", "arr": "08:00", "dep": "Destination", "day": 2, "platform": "5"}
            ]
        },
        {
            "train_number": "12760",
            "train_name": "Charminar Superfast Express (Return)",
            "train_type": "Superfast",
            "source": "HYB", "source_name": "Hyderabad Deccan",
            "dest": "MAS", "dest_name": "Chennai Central",
            "dep": "18:00", "arr": "07:55", "duration": "13h 55m", "distance": 790.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 2680.0, "base_fare_2a": 1580.0, "base_fare_3a": 1120.0, "base_fare_sl": 415.0,
            "route": [
                {"code": "HYB", "name": "Hyderabad Deccan", "arr": "Source", "dep": "18:00", "day": 1, "platform": "5"},
                {"code": "BZA", "name": "Vijayawada Jn", "arr": "00:50", "dep": "01:00", "day": 2, "platform": "1"},
                {"code": "MAS", "name": "Chennai Central", "arr": "07:55", "dep": "Destination", "day": 2, "platform": "9"}
            ]
        },

        # --- BENGALURU <-> HYDERABAD ---
        {
            "train_number": "12786",
            "train_name": "Kacheguda Superfast Express",
            "train_type": "Superfast",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "HYB", "dest_name": "Hyderabad Deccan",
            "dep": "18:20", "arr": "05:40", "duration": "11h 20m", "distance": 622.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 2240.0, "base_fare_2a": 1340.0, "base_fare_3a": 940.0, "base_fare_sl": 360.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "18:20", "day": 1, "platform": "3"},
                {"code": "HYB", "name": "Hyderabad Deccan", "arr": "05:40", "dep": "Destination", "day": 2, "platform": "4"}
            ]
        },
        {
            "train_number": "20704",
            "train_name": "Kacheguda Vande Bharat Express",
            "train_type": "Vande Bharat",
            "source": "SBC", "source_name": "KSR Bengaluru",
            "dest": "HYB", "dest_name": "Hyderabad Deccan",
            "dep": "14:45", "arr": "23:00", "duration": "8h 15m", "distance": 622.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1540.0, "base_fare_ec": 2890.0,
            "route": [
                {"code": "SBC", "name": "KSR Bengaluru", "arr": "Source", "dep": "14:45", "day": 1, "platform": "1"},
                {"code": "HYB", "name": "Hyderabad Deccan", "arr": "23:00", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },

        # --- CHENNAI <-> MUMBAI ---
        {
            "train_number": "12164",
            "train_name": "Chennai - Mumbai CSMT Superfast",
            "train_type": "Superfast",
            "source": "MAS", "source_name": "Chennai Central",
            "dest": "CSMT", "dest_name": "Mumbai CSMT",
            "dep": "06:20", "arr": "06:00", "duration": "23h 40m", "distance": 1281.0,
            "classes": ["2A", "3A", "SL"],
            "base_fare_2a": 2250.0, "base_fare_3a": 1580.0, "base_fare_sl": 590.0,
            "route": [
                {"code": "MAS", "name": "Chennai Central", "arr": "Source", "dep": "06:20", "day": 1, "platform": "5"},
                {"code": "CSMT", "name": "Mumbai CSMT", "arr": "06:00", "dep": "Destination", "day": 2, "platform": "14"}
            ]
        },

        # --- NATIONAL TRUNK (Delhi, Kanpur, Prayagraj, Howrah) ---
        {
            "train_number": "12393",
            "train_name": "Sampoorna Kranti Express",
            "train_type": "Superfast",
            "source": "NDLS", "source_name": "New Delhi",
            "dest": "CNB", "dest_name": "Kanpur Central",
            "dep": "17:30", "arr": "22:25", "duration": "4h 55m", "distance": 440.0,
            "classes": ["1A", "2A", "3A", "SL"],
            "base_fare_1a": 1640.0, "base_fare_2a": 980.0, "base_fare_3a": 690.0, "base_fare_sl": 270.0,
            "route": [
                {"code": "NDLS", "name": "New Delhi", "arr": "Source", "dep": "17:30", "day": 1, "platform": "16"},
                {"code": "CNB", "name": "Kanpur Central", "arr": "22:25", "dep": "Destination", "day": 1, "platform": "5"}
            ]
        },
        {
            "train_number": "22436",
            "train_name": "Vande Bharat Express (NDLS - BSB)",
            "train_type": "Vande Bharat",
            "source": "NDLS", "source_name": "New Delhi",
            "dest": "CNB", "dest_name": "Kanpur Central",
            "dep": "06:00", "arr": "10:08", "duration": "4h 08m", "distance": 440.0,
            "classes": ["CC", "EC"],
            "base_fare_cc": 1120.0, "base_fare_ec": 2180.0,
            "route": [
                {"code": "NDLS", "name": "New Delhi", "arr": "Source", "dep": "06:00", "day": 1, "platform": "1"},
                {"code": "CNB", "name": "Kanpur Central", "arr": "10:08", "dep": "Destination", "day": 1, "platform": "1"}
            ]
        },
        {
            "train_number": "12301",
            "train_name": "Howrah Rajdhani Express",
            "train_type": "Rajdhani",
            "source": "HWH", "source_name": "Howrah Junction",
            "dest": "NDLS", "dest_name": "New Delhi",
            "dep": "16:50", "arr": "10:05", "duration": "17h 15m", "distance": 1450.0,
            "classes": ["1A", "2A", "3A"],
            "base_fare_1a": 3480.0, "base_fare_2a": 2290.0, "base_fare_3a": 1680.0,
            "route": [
                {"code": "HWH", "name": "Howrah Junction", "arr": "Source", "dep": "16:50", "day": 1, "platform": "9"},
                {"code": "PRYJ", "name": "Prayagraj Jn", "arr": "02:18", "dep": "02:20", "day": 2, "platform": "1"},
                {"code": "CNB", "name": "Kanpur Central", "arr": "04:15", "dep": "04:20", "day": 2, "platform": "1"},
                {"code": "NDLS", "name": "New Delhi", "arr": "10:05", "dep": "Destination", "day": 2, "platform": "14"}
            ]
        },
        {
            "train_number": "12951",
            "train_name": "Mumbai Rajdhani Express",
            "train_type": "Rajdhani",
            "source": "CSMT", "source_name": "Mumbai CSMT",
            "dest": "NDLS", "dest_name": "New Delhi",
            "dep": "17:00", "arr": "08:32", "duration": "15h 32m", "distance": 1386.0,
            "classes": ["1A", "2A", "3A"],
            "base_fare_1a": 3450.0, "base_fare_2a": 2250.0, "base_fare_3a": 1650.0,
            "route": [
                {"code": "CSMT", "name": "Mumbai CSMT", "arr": "Source", "dep": "17:00", "day": 1, "platform": "18"},
                {"code": "NDLS", "name": "New Delhi", "arr": "08:32", "dep": "Destination", "day": 2, "platform": "2"}
            ]
        }
    ]

    for t_data in trains_seed:
        existing = db.query(TrainCatalog).filter(TrainCatalog.train_number == t_data["train_number"]).first()
        if not existing:
            tr = TrainCatalog(
                train_number=t_data["train_number"],
                train_name=t_data["train_name"],
                train_type=t_data["train_type"],
                source_station_code=t_data["source"],
                source_station_name=t_data["source_name"],
                destination_station_code=t_data["dest"],
                destination_station_name=t_data["dest_name"],
                departure_time=t_data["dep"],
                arrival_time=t_data["arr"],
                duration_hours=t_data["duration"],
                distance_km=t_data["distance"],
                running_days="Daily",
                available_classes=json.dumps(t_data["classes"]),
                route_stations=json.dumps(t_data["route"]),
                base_fare_1a=t_data.get("base_fare_1a", 1600.0),
                base_fare_2a=t_data.get("base_fare_2a", 980.0),
                base_fare_3a=t_data.get("base_fare_3a", 690.0),
                base_fare_sl=t_data.get("base_fare_sl", 270.0),
                base_fare_cc=t_data.get("base_fare_cc", 520.0),
                base_fare_ec=t_data.get("base_fare_ec", 1120.0),
                base_fare_2s=t_data.get("base_fare_2s", 145.0),
                is_active=True,
                is_simulated=True
            )
            db.add(tr)
        else:
            existing.train_name = t_data["train_name"]
            existing.train_type = t_data["train_type"]
            existing.available_classes = json.dumps(t_data["classes"])
            existing.route_stations = json.dumps(t_data["route"])
    db.commit()

    # 3. Seed Class-wise Seat Inventory for Next 7 Days
    all_trains = db.query(TrainCatalog).filter(TrainCatalog.is_active == True).all()
    dates_to_seed = [(datetime.date.today() + datetime.timedelta(days=d)).isoformat() for d in range(7)]

    for tr in all_trains:
        classes = json.loads(tr.available_classes or "[]")
        for date_str in dates_to_seed:
            for cls in classes:
                inv = db.query(SeatInventory).filter(
                    SeatInventory.train_number == tr.train_number,
                    SeatInventory.journey_date == date_str,
                    SeatInventory.travel_class == cls
                ).first()

                if not inv:
                    total_quota = 72 if cls in ["3A", "SL", "CC", "2S"] else (48 if cls == "2A" else 24)
                    booked = random.randint(2, max(3, total_quota - 8))
                    available = max(0, total_quota - booked)
                    
                    if cls == "1A": fare = tr.base_fare_1a
                    elif cls == "2A": fare = tr.base_fare_2a
                    elif cls == "3A": fare = tr.base_fare_3a
                    elif cls == "SL": fare = tr.base_fare_sl
                    elif cls == "CC": fare = tr.base_fare_cc
                    elif cls == "EC": fare = tr.base_fare_ec
                    else: fare = tr.base_fare_2s

                    new_inv = SeatInventory(
                        train_number=tr.train_number,
                        journey_date=date_str,
                        travel_class=cls,
                        total_quota=total_quota,
                        available_seats=available,
                        booked_seats=booked,
                        rac_seats=8,
                        waiting_list=0,
                        fare_amount=fare
                    )
                    db.add(new_inv)
    db.commit()

    # 4. Seed Realistic Sample Demo Bookings (with unique 10-digit Demo PNRs)
    if db.query(Booking).count() == 0:
        demo_bookings = [
            {
                "booking_ref": "RR-BK-12637-891",
                "pnr": "4829103847",
                "train_number": "12637",
                "train_name": "Pandian Superfast Express",
                "source": "MS", "source_name": "Chennai Egmore",
                "dest": "MDU", "dest_name": "Madurai Junction",
                "date": today_str,
                "dep": "21:40", "arr": "05:35",
                "class": "3A",
                "passengers": [
                    {"name": "M. Senthil Nathan", "age": 34, "gender": "Male", "pref": "Lower", "coach": "B2", "berth": "32", "type": "LOWER"},
                    {"name": "S. Kavitha", "age": 30, "gender": "Female", "pref": "Middle", "coach": "B2", "berth": "33", "type": "MIDDLE"}
                ],
                "base_fare": 1530.0, "res_charge": 80.0, "sf_charge": 90.0, "gst": 85.0, "total": 1785.0,
                "email": "senthil.nathan@railresq.gov.in", "phone": "+91 94440 12345"
            },
            {
                "booking_ref": "RR-BK-20607-412",
                "pnr": "6194820371",
                "train_number": "20607",
                "train_name": "Vande Bharat Express (MAS - MYS via SBC)",
                "source": "MAS", "source_name": "Chennai Central",
                "dest": "SBC", "dest_name": "KSR Bengaluru",
                "date": today_str,
                "dep": "05:50", "arr": "10:10",
                "class": "CC",
                "passengers": [
                    {"name": "Priya Sundaram", "age": 28, "gender": "Female", "pref": "Window", "coach": "C2", "berth": "24", "type": "WINDOW"}
                ],
                "base_fare": 985.0, "res_charge": 40.0, "sf_charge": 45.0, "gst": 53.5, "total": 1123.5,
                "email": "priya.sundaram@railresq.gov.in", "phone": "+91 98401 23456"
            },
            {
                "booking_ref": "RR-BK-12675-703",
                "pnr": "4456758829",
                "train_number": "12675",
                "train_name": "Kovai Superfast Express",
                "source": "MAS", "source_name": "Chennai Central",
                "dest": "CBE", "dest_name": "Coimbatore Junction",
                "date": (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
                "dep": "06:10", "arr": "14:05",
                "class": "CC",
                "passengers": [
                    {"name": "K. Anantharaman", "age": 58, "gender": "Male", "pref": "Window", "coach": "C1", "berth": "16", "type": "WINDOW"}
                ],
                "base_fare": 645.0, "res_charge": 40.0, "sf_charge": 45.0, "gst": 36.5, "total": 766.5,
                "email": "ananth.k@gmail.com", "phone": "+91 98840 98765"
            }
        ]

        for b_data in demo_bookings:
            new_booking = Booking(
                booking_reference=b_data["booking_ref"],
                demo_pnr=b_data["pnr"],
                train_number=b_data["train_number"],
                train_name=b_data["train_name"],
                source_station_code=b_data["source"],
                source_station_name=b_data["source_name"],
                destination_station_code=b_data["dest"],
                destination_station_name=b_data["dest_name"],
                journey_date=b_data["date"],
                departure_time=b_data["dep"],
                arrival_time=b_data["arr"],
                travel_class=b_data["class"],
                quota="GENERAL",
                passenger_count=len(b_data["passengers"]),
                base_fare=b_data["base_fare"],
                reservation_charge=b_data["res_charge"],
                superfast_charge=b_data["sf_charge"],
                gst_amount=b_data["gst"],
                total_fare=b_data["total"],
                booking_status="CONFIRMED",
                payment_status="PAID",
                payment_method="UPI",
                transaction_id=f"TXN-UPI-{random.randint(10000000, 99999999)}",
                is_simulated=True,
                contact_email=b_data["email"],
                contact_phone=b_data["phone"]
            )
            db.add(new_booking)
            db.commit()
            db.refresh(new_booking)

            for p in b_data["passengers"]:
                bp = BookingPassenger(
                    booking_id=new_booking.id,
                    passenger_name=p["name"],
                    age=p["age"],
                    gender=p["gender"],
                    berth_preference=p["pref"],
                    allocated_coach=p["coach"],
                    allocated_berth=p["berth"],
                    allocated_berth_type=p["type"],
                    ticket_status="CNF"
                )
                db.add(bp)

            pr = PaymentRecord(
                transaction_reference=new_booking.transaction_id,
                booking_reference=new_booking.booking_reference,
                demo_pnr=new_booking.demo_pnr,
                amount=new_booking.total_fare,
                payment_method="UPI",
                status="SUCCESS",
                gateway_reference=f"RAILRESQ-MOCK-GW-{random.randint(100000, 999999)}",
                is_simulated=True
            )
            db.add(pr)

        db.commit()
