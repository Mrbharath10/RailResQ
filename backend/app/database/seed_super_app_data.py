import json
import random
import datetime
from sqlalchemy.orm import Session
from app.models.super_app_entities import (
    Restaurant,
    FoodItem,
    FoodOrder,
    GroceryProduct,
    GroceryOrder,
    EmergencyFacility,
    TransportVehicle,
    RideBooking,
    TouristPlace,
    SavedWishlistPlace,
    APIIntegrationAdapter
)


def seed_super_app(db: Session):
    """
    Seeds comprehensive data for:
    - Restaurants & Food Menus (Swiggy / Zomato style)
    - Grocery & Travel Essentials (Blinkit / Instamart style)
    - Police & Ambulance Emergency Directory (112 India)
    - Local Transport (Rapido style)
    - AI Tourist Discovery (Explore Destinations across 6 categories)
    - API Integration Registry
    """
    # --------------------------------------------------------------------------
    # 1. API Integration Adapters
    # --------------------------------------------------------------------------
    adapters = [
        {"service_name": "IRCTC_RAILWAY", "provider_name": "Indian Railways / IRCTC Adapter", "category": "RAILWAY", "adapter_status": "DEMO", "endpoint_url": "https://api.irctc.gov.in/v2", "latency_ms": 42, "notes": "Simulated railway booking engine with 40 trains and concurrency-safe quota allocation."},
        {"service_name": "SWIGGY_FOOD", "provider_name": "Swiggy Food Delivery Adapter", "category": "FOOD", "adapter_status": "DEMO", "endpoint_url": "https://api.swiggy.com/v1/food", "latency_ms": 38, "notes": "Station-side & berth-side delivery simulation with real restaurant menus."},
        {"service_name": "ZOMATO_FOOD", "provider_name": "Zomato Restaurant Delivery", "category": "FOOD", "adapter_status": "DEMO", "endpoint_url": "https://api.zomato.com/v2/orders", "latency_ms": 50, "notes": "Live restaurant discovery and food cart adapter."},
        {"service_name": "BLINKIT_GROCERY", "provider_name": "Blinkit 10-Minute Grocery", "category": "GROCERY", "adapter_status": "DEMO", "endpoint_url": "https://api.blinkit.com/v1/express", "latency_ms": 35, "notes": "Express delivery for travel essentials, snacks, and beverages."},
        {"service_name": "SWIGGY_INSTAMART", "provider_name": "Swiggy Instamart Grocery", "category": "GROCERY", "adapter_status": "DEMO", "endpoint_url": "https://api.swiggy.com/v1/instamart", "latency_ms": 40, "notes": "Instant grocery and packaged foods adapter."},
        {"service_name": "RAPIDO_TRANSPORT", "provider_name": "Rapido Bike Taxi & Auto", "category": "TRANSPORT", "adapter_status": "DEMO", "endpoint_url": "https://api.rapido.bike/v2/rides", "latency_ms": 28, "notes": "Station pickup and city commute ride estimation adapter."},
        {"service_name": "EMERGENCY_112_INDIA", "provider_name": "National Emergency Response System (112)", "category": "EMERGENCY", "adapter_status": "LIVE", "endpoint_url": "tel:112", "latency_ms": 10, "notes": "Direct telephone and location-dispatch integration with India Emergency 112."},
        {"service_name": "GOOGLE_PLACES_API", "provider_name": "Google Maps & Places Platform", "category": "TOURISM", "adapter_status": "DEMO", "endpoint_url": "https://maps.googleapis.com/maps/api/place", "latency_ms": 65, "notes": "Retrieved place metadata with verified coordinates, ratings, and opening hours."},
        {"service_name": "GOOGLE_GEMINI_AI", "provider_name": "Google DeepMind Gemini API", "category": "AI", "adapter_status": "LIVE", "endpoint_url": "https://generativelanguage.googleapis.com/v1beta", "latency_ms": 320, "notes": "Generative multimodal travel recommendations and itinerary planning."}
    ]

    for ad in adapters:
        exist = db.query(APIIntegrationAdapter).filter(APIIntegrationAdapter.service_name == ad["service_name"]).first()
        if not exist:
            db.add(APIIntegrationAdapter(**ad))
        else:
            exist.adapter_status = ad["adapter_status"]
            exist.endpoint_url = ad["endpoint_url"]
            exist.notes = ad["notes"]
    db.commit()

    # --------------------------------------------------------------------------
    # 2. Restaurants & Food Menus (Swiggy / Zomato Inspired)
    # --------------------------------------------------------------------------
    restaurants_data = [
        {
            "name": "Murugan Idli Shop",
            "station_code": "MS",
            "city": "Chennai",
            "cuisine_type": "South Indian, Pure Vegetarian",
            "rating": 4.7,
            "delivery_time_mins": 20,
            "min_order_amount": 100.0,
            "price_for_two": 250.0,
            "address": "Opp. Chennai Egmore Station, Kennet Lane, Egmore, Chennai",
            "image_url": "/food/murugan-idli.jpg",
            "is_veg_only": True,
            "operating_hours": "06:30 AM - 11:00 PM",
            "phone_number": "+91 44 2819 1234",
            "items": [
                {"name": "Ghee Podi Idli (4 Pcs)", "description": "Soft steamed rice cakes tossed in signature spicy gun powder and pure cow ghee.", "price": 95.0, "category": "South Indian", "is_veg": True, "spice_level": "Medium", "image_url": "/food/murugan-idli.jpg"},
                {"name": "Medu Vada (2 Pcs)", "description": "Crispy golden lentil fritters served with 4 varieties of chutneys and piping hot sambar.", "price": 65.0, "category": "South Indian", "is_veg": True, "spice_level": "Mild", "image_url": "/food/murugan-idli.jpg"},
                {"name": "Special Masala Dosa", "description": "Crispy golden crepe smeared with red chutney and stuffed with spiced potato masala.", "price": 110.0, "category": "South Indian", "is_veg": True, "spice_level": "Medium", "image_url": "/food/vidyarthi-bhavan.jpg"},
                {"name": "Madras Filter Coffee", "description": "Traditional aromatic chicory blended filter coffee brewed with rich frothy milk.", "price": 35.0, "category": "Beverages", "is_veg": True, "spice_level": "Mild", "image_url": "/food/vidyarthi-bhavan.jpg"}
            ]
        },
        {
            "name": "Dindigul Thalappakatti Biryani",
            "station_code": "MDU",
            "city": "Madurai",
            "cuisine_type": "Biryani, South Indian Non-Veg",
            "rating": 4.6,
            "delivery_time_mins": 30,
            "min_order_amount": 200.0,
            "price_for_two": 550.0,
            "address": "West Veli Street, Near Madurai Junction Railway Station",
            "image_url": "/food/dindigul-biryani.jpg",
            "is_veg_only": False,
            "operating_hours": "11:00 AM - 11:30 PM",
            "phone_number": "+91 452 234 5678",
            "items": [
                {"name": "Thalappakatti Mutton Biryani", "description": "Authentic Seeraga Samba rice biryani cooked with tender young mutton and secret hill spices.", "price": 340.0, "category": "Biryani", "is_veg": False, "spice_level": "Spicy", "image_url": "/food/dindigul-biryani.jpg"},
                {"name": "Thalappakatti Chicken Biryani", "description": "Aromatic Seeraga Samba biryani slow-cooked with succulent country chicken pieces.", "price": 270.0, "category": "Biryani", "is_veg": False, "spice_level": "Medium", "image_url": "/food/dindigul-biryani.jpg"},
                {"name": "Chicken 65 (Boneless)", "description": "Deep-fried crispy spiced chicken chunks garnished with curry leaves and lemon wedges.", "price": 210.0, "category": "Starters", "is_veg": False, "spice_level": "Spicy", "image_url": "/food/junior-kuppanna.jpg"},
                {"name": "Madurai Jigarthanda Special", "description": "World-famous royal Madurai drink made with almond gum, nannari syrup, and basundi ice-cream.", "price": 85.0, "category": "Desserts", "is_veg": True, "spice_level": "Mild", "image_url": "/food/dindigul-biryani.jpg"}
            ]
        },
        {
            "name": "Hotel Saravana Bhavan",
            "station_code": "MAS",
            "city": "Chennai",
            "cuisine_type": "Pure Vegetarian, Meals, Tiffin",
            "rating": 4.5,
            "delivery_time_mins": 25,
            "min_order_amount": 120.0,
            "price_for_two": 350.0,
            "address": "Poonamallee High Road, Opposite Central Railway Station, Park Town",
            "image_url": "/food/saravana-bhavan.jpg",
            "is_veg_only": True,
            "operating_hours": "06:00 AM - 10:30 PM",
            "phone_number": "+91 44 2535 9900",
            "items": [
                {"name": "South Indian Executive Thali Meals", "description": "Wholesome combo of Ponni rice, Sambar, Rasam, Kootu, Poriyal, Kara Kuzhambu, Curd, Appalam, and Sweet.", "price": 180.0, "category": "Thali", "is_veg": True, "spice_level": "Medium", "image_url": "/food/saravana-bhavan.jpg"},
                {"name": "Ghee Roast Dosa", "description": "Paper-thin ultra-crisp crepe roasted with generous pure ghee, served with 3 chutneys.", "price": 125.0, "category": "South Indian", "is_veg": True, "spice_level": "Mild", "image_url": "/food/vidyarthi-bhavan.jpg"},
                {"name": "Curd Rice with Pomegranate", "description": "Cooling tempered yoghurt rice garnished with mustard, ginger, green chillies, and fresh pomegranate.", "price": 95.0, "category": "South Indian", "is_veg": True, "spice_level": "Mild", "image_url": "/food/saravana-bhavan.jpg"},
                {"name": "Badam Halwa (100g)", "description": "Rich traditional almond halwa cooked slowly in ghee and saffron.", "price": 140.0, "category": "Desserts", "is_veg": True, "spice_level": "Mild", "image_url": "/food/saravana-bhavan.jpg"}
            ]
        },
        {
            "name": "Junior Kuppanna (Kongu Cuisine)",
            "station_code": "CBE",
            "city": "Coimbatore",
            "cuisine_type": "Kongunadu Non-Veg & Biryani",
            "rating": 4.6,
            "delivery_time_mins": 25,
            "min_order_amount": 180.0,
            "price_for_two": 480.0,
            "address": "Near Coimbatore Railway Junction, State Bank Road, Gopalapuram",
            "image_url": "/food/junior-kuppanna.jpg",
            "is_veg_only": False,
            "operating_hours": "11:30 AM - 11:00 PM",
            "phone_number": "+91 422 230 4455",
            "items": [
                {"name": "Kongu Mutton Pallipalayam", "description": "Legendary Kongu dry-roasted mutton cooked with shallots and fresh red chillies.", "price": 310.0, "category": "Starters", "is_veg": False, "spice_level": "Spicy", "image_url": "/food/junior-kuppanna.jpg"},
                {"name": "Kuppanna Chicken Biryani", "description": "Tender chicken cooked with fragrant short-grain rice and traditional Kongunadu masala.", "price": 240.0, "category": "Biryani", "is_veg": False, "spice_level": "Medium", "image_url": "/food/dindigul-biryani.jpg"},
                {"name": "Parotta Combo (2 Pcs with Salna)", "description": "Flaky layered Malabar-style parottas served with rich aromatic chicken salna gravy.", "price": 120.0, "category": "Main Course", "is_veg": False, "spice_level": "Medium", "image_url": "/food/junior-kuppanna.jpg"}
            ]
        },
        {
            "name": "Vidyarthi Bhavan Express",
            "station_code": "SBC",
            "city": "Bengaluru",
            "cuisine_type": "Karnataka Tiffin, Filter Coffee",
            "rating": 4.8,
            "delivery_time_mins": 20,
            "min_order_amount": 80.0,
            "price_for_two": 200.0,
            "address": "Platform 1 Concourse & Gubbi Thotadappa Road, Majestic, Bengaluru",
            "image_url": "/food/vidyarthi-bhavan.jpg",
            "is_veg_only": True,
            "operating_hours": "06:30 AM - 10:00 PM",
            "phone_number": "+91 80 2667 7588",
            "items": [
                {"name": "Vidyarthi Bhavan Benne Masala Dosa", "description": "Iconic thick, crispy, golden-brown butter dosa served with thick coconut chutney.", "price": 85.0, "category": "South Indian", "is_veg": True, "spice_level": "Medium", "image_url": "/food/vidyarthi-bhavan.jpg"},
                {"name": "Rava Vada (2 Pcs)", "description": "Crisp semolina patties with cashews, ginger, and curry leaves.", "price": 60.0, "category": "Snacks", "is_veg": True, "spice_level": "Mild", "image_url": "/food/murugan-idli.jpg"},
                {"name": "Filter Kaapi", "description": "Authentic Chikmagalur bean filter coffee served in brass davarah-tumbler.", "price": 30.0, "category": "Beverages", "is_veg": True, "spice_level": "Mild", "image_url": "/food/vidyarthi-bhavan.jpg"}
            ]
        }
    ]

    for r_data in restaurants_data:
        items = r_data.pop("items")
        r_exist = db.query(Restaurant).filter(Restaurant.name == r_data["name"]).first()
        if not r_exist:
            r_obj = Restaurant(**r_data)
            db.add(r_obj)
            db.commit()
            db.refresh(r_obj)
            for it in items:
                db.add(FoodItem(restaurant_id=r_obj.id, **it))
        else:
            for it in items:
                if not db.query(FoodItem).filter(FoodItem.restaurant_id == r_exist.id, FoodItem.name == it["name"]).first():
                    db.add(FoodItem(restaurant_id=r_exist.id, **it))
    db.commit()

    # --------------------------------------------------------------------------
    # 3. Grocery Products (Blinkit / Swiggy Instamart Inspired)
    # --------------------------------------------------------------------------
    grocery_data = [
        {"name": "Kinley Mineral Water (1 Litre)", "category": "Travel Essentials", "description": "Packaged drinking water with added minerals, 100% safe & chilled.", "price": 20.0, "unit": "1 Litre Bottle", "brand": "Kinley", "image_url": "/grocery/kinley-water.jpg", "discount_pct": 0},
        {"name": "Lay's India's Magic Masala Chips", "category": "Snacks & Munchies", "description": "Crispy ridges potato chips seasoned with authentic Indian spices.", "price": 20.0, "unit": "50g Pack", "brand": "Lay's", "image_url": "/grocery/lays-chips.jpg", "discount_pct": 5},
        {"name": "Haldiram's Aloo Bhujia", "category": "Snacks & Munchies", "description": "Crispy, crunchy spiced potato and gram flour sev snack.", "price": 50.0, "unit": "150g Pack", "brand": "Haldiram's", "image_url": "/grocery/aloo-bhujia.jpg", "discount_pct": 10},
        {"name": "Amul Taaza Homogenised Toned Milk", "category": "Dairy & Bread", "description": "Pure cow milk UHT treated, 100% bacteria free, ready to drink.", "price": 32.0, "unit": "500ml Tetra Pack", "brand": "Amul", "image_url": "/grocery/amul-milk.jpg", "discount_pct": 0},
        {"name": "Fresh Bananas (Robusta)", "category": "Fruits & Vegetables", "description": "Freshly harvested, naturally ripened sweet bananas packed with potassium.", "price": 40.0, "unit": "6 Pcs (approx 600g)", "brand": "Farm Fresh", "image_url": "/grocery/fresh-bananas.jpg", "discount_pct": 0},
        {"name": "Britannia 100% Whole Wheat Bread", "category": "Dairy & Bread", "description": "High fiber soft whole wheat bread, baked fresh daily.", "price": 45.0, "unit": "400g Pack", "brand": "Britannia", "image_url": "/grocery/wheat-bread.jpg", "discount_pct": 5},
        {"name": "Dettol Antiseptic Wet Wipes (25 Pcs)", "category": "Travel Essentials", "description": "Kills 99.9% germs, gentle on skin, ideal for train travel hygiene.", "price": 115.0, "unit": "25 Wipes Pack", "brand": "Dettol", "image_url": "/grocery/dettol-wipes.jpg", "discount_pct": 10},
        {"name": "Lifebuoy Hand Sanitizer Gel (100ml)", "category": "Personal Care", "description": "Instant hand sanitizer with 70% alcohol and Vitamin E.", "price": 50.0, "unit": "100ml Bottle", "brand": "Lifebuoy", "image_url": "/grocery/lifebuoy-sanitizer.jpg", "discount_pct": 0},
        {"name": "Colgate Total Travel Toothbrush & Paste Kit", "category": "Personal Care", "description": "Compact foldable travel toothbrush with 30g anti-cavity toothpaste.", "price": 75.0, "unit": "Travel Kit", "brand": "Colgate", "image_url": "/grocery/colgate-kit.jpg", "discount_pct": 15},
        {"name": "Tropicana 100% Real Mixed Fruit Juice", "category": "Beverages", "description": "Rich fruit juice with no added sugar or preservatives.", "price": 110.0, "unit": "1 Litre Tetrapack", "brand": "Tropicana", "image_url": "/grocery/fruit-juice.jpg", "discount_pct": 10},
        {"name": "Nescafe Classic Ready-to-Drink Hazelnut Cold Coffee", "category": "Beverages", "description": "Creamy chilled coffee with rich hazelnut notes, perfect on the go.", "price": 40.0, "unit": "180ml Can", "brand": "Nescafe", "image_url": "/grocery/cold-coffee.jpg", "discount_pct": 0},
        {"name": "Travel Inflatable Neck Pillow & Eye Mask", "category": "Travel Essentials", "description": "Ergonomic velvety neck pillow with 3D contoured sleep eye mask.", "price": 249.0, "unit": "1 Set", "brand": "RailComfort", "image_url": "/grocery/neck-pillow.jpg", "discount_pct": 20}
    ]

    for g in grocery_data:
        g_exist = db.query(GroceryProduct).filter(GroceryProduct.name == g["name"]).first()
        if not g_exist:
            db.add(GroceryProduct(**g))
        else:
            g_exist.image_url = g["image_url"]
    db.commit()

    # --------------------------------------------------------------------------
    # 4. Emergency Facilities (Police, Hospitals, Ambulances)
    # --------------------------------------------------------------------------
    facilities = [
        # Chennai
        {"name": "Railway Police Station (RPF / GRP)", "facility_type": "POLICE", "city": "Chennai", "state": "Tamil Nadu", "station_code": "MAS", "address": "Platform 1 Concourse, MGR Chennai Central Railway Station", "phone_number": "+91 44 2535 3999", "emergency_helpline": "139 / 112", "latitude": 13.0827, "longitude": 80.2707, "distance_km": 0.1, "is_24x7": True},
        {"name": "Egmore Police Station (F-1)", "facility_type": "POLICE", "city": "Chennai", "state": "Tamil Nadu", "station_code": "MS", "address": "Gandhi Irwin Road, Opposite Egmore Railway Station, Chennai", "phone_number": "+91 44 2345 2588", "emergency_helpline": "112 / 100", "latitude": 13.0782, "longitude": 80.2608, "distance_km": 0.2, "is_24x7": True},
        {"name": "Rajiv Gandhi Government General Hospital (RGGGH)", "facility_type": "HOSPITAL", "city": "Chennai", "state": "Tamil Nadu", "station_code": "MAS", "address": "EVR Periyar Salai, Opposite Chennai Central Station, Park Town", "phone_number": "+91 44 2530 5000", "emergency_helpline": "108 / 112", "latitude": 13.0805, "longitude": 80.2764, "distance_km": 0.4, "is_24x7": True, "has_icu": True, "ambulances_available": 12},
        {"name": "Apollo Hospitals Greams Road", "facility_type": "HOSPITAL", "city": "Chennai", "state": "Tamil Nadu", "station_code": "MS", "address": "21 Greams Lane, Off Greams Road, Thousand Lights, Chennai", "phone_number": "+91 44 2829 0200", "emergency_helpline": "1066 / 112", "latitude": 13.0604, "longitude": 80.2518, "distance_km": 2.8, "is_24x7": True, "has_icu": True, "ambulances_available": 8},
        {"name": "108 GVK-EMRI Central Ambulance Hub", "facility_type": "AMBULANCE_PROVIDER", "city": "Chennai", "state": "Tamil Nadu", "station_code": "MAS", "address": "Park Town Emergency Response Bay, Chennai Central", "phone_number": "+91 44 2535 0108", "emergency_helpline": "108", "latitude": 13.0818, "longitude": 80.2715, "distance_km": 0.2, "is_24x7": True, "ambulances_available": 15},

        # Madurai
        {"name": "Madurai Junction RPF Outpost", "facility_type": "POLICE", "city": "Madurai", "state": "Tamil Nadu", "station_code": "MDU", "address": "Platform 1, Madurai Railway Junction, West Veli Street", "phone_number": "+91 452 234 1139", "emergency_helpline": "139 / 112", "latitude": 9.9174, "longitude": 78.1130, "distance_km": 0.1, "is_24x7": True},
        {"name": "Government Rajaji Hospital (GRH)", "facility_type": "HOSPITAL", "city": "Madurai", "state": "Tamil Nadu", "station_code": "MDU", "address": "Panagal Road, Shenoy Nagar, Madurai", "phone_number": "+91 452 253 2535", "emergency_helpline": "108 / 112", "latitude": 9.9252, "longitude": 78.1256, "distance_km": 1.6, "is_24x7": True, "has_icu": True, "ambulances_available": 9},

        # Coimbatore
        {"name": "Coimbatore City Police Station (B-1)", "facility_type": "POLICE", "city": "Coimbatore", "state": "Tamil Nadu", "station_code": "CBE", "address": "State Bank Road, Near Coimbatore Junction, Coimbatore", "phone_number": "+91 422 230 0100", "emergency_helpline": "112 / 100", "latitude": 11.0016, "longitude": 76.9668, "distance_km": 0.3, "is_24x7": True},
        {"name": "Coimbatore Medical College Hospital (CMCH)", "facility_type": "HOSPITAL", "city": "Coimbatore", "state": "Tamil Nadu", "station_code": "CBE", "address": "Trichy Road, Gopalapuram, Coimbatore", "phone_number": "+91 422 230 1393", "emergency_helpline": "108 / 112", "latitude": 10.9995, "longitude": 76.9720, "distance_km": 0.7, "is_24x7": True, "has_icu": True, "ambulances_available": 10},

        # Bengaluru
        {"name": "City Railway Police Station", "facility_type": "POLICE", "city": "Bengaluru", "state": "Karnataka", "station_code": "SBC", "address": "Platform 1, KSR Bengaluru City Railway Station, Majestic", "phone_number": "+91 80 2287 1139", "emergency_helpline": "112 / 139", "latitude": 12.9781, "longitude": 77.5696, "distance_km": 0.1, "is_24x7": True},
        {"name": "Victoria Hospital Trauma Center", "facility_type": "HOSPITAL", "city": "Bengaluru", "state": "Karnataka", "station_code": "SBC", "address": "Fort Road, Near City Market, Kalasipalya, Bengaluru", "phone_number": "+91 80 2670 1150", "emergency_helpline": "108 / 112", "latitude": 12.9625, "longitude": 77.5756, "distance_km": 1.8, "is_24x7": True, "has_icu": True, "ambulances_available": 14}
    ]

    for f in facilities:
        f_exist = db.query(EmergencyFacility).filter(EmergencyFacility.name == f["name"]).first()
        if not f_exist:
            db.add(EmergencyFacility(**f))
    db.commit()

    # --------------------------------------------------------------------------
    # 5. Local Transport Vehicles (Rapido / Auto / Cab Inspired)
    # --------------------------------------------------------------------------
    transport_fleet = [
        {"vehicle_type": "BIKE_TAXI", "name": "Rapido Bike Taxi", "city": "Chennai", "station_code": "MAS", "base_fare": 25.0, "per_km_rate": 8.0, "eta_mins": 3, "capacity_passengers": 1, "icon_name": "Bike"},
        {"vehicle_type": "AUTO", "name": "City Auto Metered", "city": "Chennai", "station_code": "MAS", "base_fare": 40.0, "per_km_rate": 15.0, "eta_mins": 4, "capacity_passengers": 3, "icon_name": "Auto"},
        {"vehicle_type": "MINI_CAB", "name": "Quick Hatchback AC", "city": "Chennai", "station_code": "MAS", "base_fare": 90.0, "per_km_rate": 18.0, "eta_mins": 6, "capacity_passengers": 4, "icon_name": "Car"},
        {"vehicle_type": "SEDAN", "name": "Prime Sedan AC", "city": "Chennai", "station_code": "MAS", "base_fare": 130.0, "per_km_rate": 22.0, "eta_mins": 7, "capacity_passengers": 4, "icon_name": "Car"},
        {"vehicle_type": "BIKE_TAXI", "name": "Rapido Bike Taxi", "city": "Madurai", "station_code": "MDU", "base_fare": 20.0, "per_km_rate": 7.0, "eta_mins": 3, "capacity_passengers": 1, "icon_name": "Bike"},
        {"vehicle_type": "AUTO", "name": "Temple City Auto", "city": "Madurai", "station_code": "MDU", "base_fare": 35.0, "per_km_rate": 14.0, "eta_mins": 4, "capacity_passengers": 3, "icon_name": "Auto"},
        {"vehicle_type": "MINI_CAB", "name": "Coimbatore Cab", "city": "Coimbatore", "station_code": "CBE", "base_fare": 80.0, "per_km_rate": 17.0, "eta_mins": 5, "capacity_passengers": 4, "icon_name": "Car"},
        {"vehicle_type": "BIKE_TAXI", "name": "Rapido Express Bike", "city": "Bengaluru", "station_code": "SBC", "base_fare": 30.0, "per_km_rate": 9.0, "eta_mins": 2, "capacity_passengers": 1, "icon_name": "Bike"}
    ]

    for tv in transport_fleet:
        tv_exist = db.query(TransportVehicle).filter(TransportVehicle.name == tv["name"], TransportVehicle.city == tv["city"]).first()
        if not tv_exist:
            db.add(TransportVehicle(**tv))
    db.commit()

    # --------------------------------------------------------------------------
    # 6. AI Tourist Discovery (Explore Destinations across 6 categories)
    # --------------------------------------------------------------------------
    tourist_places_data = [
        # --- CHENNAI ---
        {
            "name": "Marina Beach",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "category": "NATURE_RECREATION",
            "sub_category": "Beach & Promenade",
            "description": "World's second-longest natural urban sandy beach stretching 13 km along the Bay of Bengal, featuring historical statues, lighthouse, and evening street food stalls.",
            "image_url": "/destinations/marina-beach.jpg",
            "address": "Kamarajar Salai, Triplicane, Chennai 600005",
            "latitude": 13.0500,
            "longitude": 80.2824,
            "rating": 4.6,
            "reviews_count": 24500,
            "opening_hours": "Open 24 Hours (Best: 05:00 AM - 08:30 PM)",
            "entry_fee": "Free Entry",
            "best_time_to_visit": "November to February",
            "nearby_station_code": "MAS",
            "distance_from_station_km": 3.8,
            "is_featured": True
        },
        {
            "name": "Kapaleeshwarar Temple",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "category": "RELIGIOUS",
            "sub_category": "Hindu Temple",
            "description": "7th-century Dravidian masterpiece dedicated to Lord Shiva, renowned for its colorful 37-meter gopuram, sacred temple tank, and ancient bronze idols.",
            "image_url": "/destinations/kapaleeshwarar-temple.jpg",
            "address": "12, North Mada Street, Mylapore, Chennai 600004",
            "latitude": 13.0336,
            "longitude": 80.2699,
            "rating": 4.8,
            "reviews_count": 18200,
            "opening_hours": "05:30 AM - 12:00 PM, 04:30 PM - 09:30 PM",
            "entry_fee": "Free Entry",
            "best_time_to_visit": "Panguni Uthiram Festival (March-April)",
            "nearby_station_code": "MS",
            "distance_from_station_km": 6.2,
            "is_featured": True
        },
        {
            "name": "Santhome Cathedral Basilica",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "category": "RELIGIOUS",
            "sub_category": "Cathedral Church",
            "description": "Historic Neo-Gothic style Catholic basilica built over the tomb of St. Thomas the Apostle, one of only three churches in the world built over an apostle's tomb.",
            "image_url": "/destinations/santhome-basilica.jpg",
            "address": "38 Santhome High Road, Mylapore, Chennai 600004",
            "latitude": 13.0334,
            "longitude": 80.2778,
            "rating": 4.7,
            "reviews_count": 11400,
            "opening_hours": "06:00 AM - 09:00 PM",
            "entry_fee": "Free Entry",
            "best_time_to_visit": "October to March",
            "nearby_station_code": "MAS",
            "distance_from_station_km": 6.8,
            "is_featured": False
        },
        {
            "name": "Arignar Anna Zoological Park (Vandalur Zoo)",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "category": "NATURE_RECREATION",
            "sub_category": "Zoo & Safari",
            "description": "India's largest zoological garden spanning 602 hectares, housing over 2,500 species of wild animals, lion & deer safaris, and butterfly park.",
            "image_url": "/destinations/vandalur-zoo.jpg",
            "address": "GST Road, Vandalur, Chennai 600048",
            "latitude": 12.8797,
            "longitude": 80.0818,
            "rating": 4.5,
            "reviews_count": 31200,
            "opening_hours": "09:00 AM - 05:00 PM (Closed on Tuesdays)",
            "entry_fee": "₹50 (Adult), ₹20 (Child)",
            "best_time_to_visit": "November to February",
            "nearby_station_code": "TBM",
            "distance_from_station_km": 5.4,
            "is_featured": True
        },
        {
            "name": "T. Nagar Ranganathan Street Shopping Hub",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "category": "SHOPPING",
            "sub_category": "Traditional Bazaar & Silk Sarees",
            "description": "Asia's bustling retail hub famous for Kanchipuram silk sarees, gold jewelry, traditional textiles, and street-side shopping.",
            "image_url": "/destinations/tnagar-market.jpg",
            "address": "Ranganathan Street, T. Nagar, Chennai 600017",
            "latitude": 13.0405,
            "longitude": 80.2337,
            "rating": 4.4,
            "reviews_count": 15600,
            "opening_hours": "10:00 AM - 10:00 PM Daily",
            "entry_fee": "Free",
            "best_time_to_visit": "Evenings & Festive Seasons",
            "nearby_station_code": "MS",
            "distance_from_station_km": 7.0,
            "is_featured": False
        },

        # --- MADURAI ---
        {
            "name": "Arulmigu Meenakshi Amman Temple",
            "city": "Madurai",
            "state": "Tamil Nadu",
            "category": "RELIGIOUS",
            "sub_category": "Ancient Hindu Temple",
            "description": "2,500-year-old architectural wonder with 14 towering gopurams, the Hall of Thousand Pillars, and sacred Golden Lotus pond dedicated to Goddess Meenakshi.",
            "image_url": "/destinations/meenakshi-temple.jpg",
            "address": "Madurai Main, Madurai, Tamil Nadu 625001",
            "latitude": 9.9195,
            "longitude": 78.1193,
            "rating": 4.9,
            "reviews_count": 48900,
            "opening_hours": "05:00 AM - 12:30 PM, 04:00 PM - 10:00 PM",
            "entry_fee": "Free Entry (Special Darshan ₹50)",
            "best_time_to_visit": "Chithirai Festival (April-May) & October to March",
            "nearby_station_code": "MDU",
            "distance_from_station_km": 1.4,
            "is_featured": True
        },
        {
            "name": "Thirumalai Nayakkar Mahal",
            "city": "Madurai",
            "state": "Tamil Nadu",
            "category": "ATTRACTION",
            "sub_category": "17th Century Royal Palace",
            "description": "Grand palace built in 1636 AD blending Dravidian and Indo-Islamic architecture, celebrated for its colossal 82-foot pillars and evening sound & light shows.",
            "image_url": "/destinations/thirumalai-mahal.jpg",
            "address": "Panthadi, Palace Road, Madurai 625001",
            "latitude": 9.9152,
            "longitude": 78.1235,
            "rating": 4.5,
            "reviews_count": 14200,
            "opening_hours": "09:00 AM - 05:00 PM (Light Show 06:45 PM)",
            "entry_fee": "₹10 (Adult), ₹50 (Light Show)",
            "best_time_to_visit": "October to March",
            "nearby_station_code": "MDU",
            "distance_from_station_km": 2.1,
            "is_featured": True
        },
        {
            "name": "Famous Jigarthanda Stall (East Gate)",
            "city": "Madurai",
            "state": "Tamil Nadu",
            "category": "FOOD_DINING",
            "sub_category": "Iconic Street Food & Dessert",
            "description": "Original legendary shop serving cooling Jigarthanda made with hand-churned condensed milk, almond gum (badam pisin), and scoops of basundi ice cream.",
            "image_url": "/destinations/jigarthanda.jpg",
            "address": "Near East Gate, Meenakshi Amman Temple Chithirai Street, Madurai",
            "latitude": 9.9188,
            "longitude": 78.1215,
            "rating": 4.8,
            "reviews_count": 9200,
            "opening_hours": "09:30 AM - 11:30 PM",
            "entry_fee": "₹60 - ₹120 per glass",
            "best_time_to_visit": "Afternoon & Post Darshan",
            "nearby_station_code": "MDU",
            "distance_from_station_km": 1.8,
            "is_featured": True
        },

        # --- COIMBATORE ---
        {
            "name": "Adiyogi Shiva Statue & Isha Yoga Center",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "category": "ATTRACTION",
            "sub_category": "Monument & Spiritual Center",
            "description": "Guinness World Record holding 112-foot steel bust of Adiyogi Shiva set amidst the Velliangiri foothills, famous for the mesmerizing 3D laser projection show.",
            "image_url": "/destinations/adiyogi-shiva.jpg",
            "address": "Isha Yoga Center, Velliangiri Foothills, Ishana Vihar, Coimbatore 641114",
            "latitude": 10.9723,
            "longitude": 76.7408,
            "rating": 4.9,
            "reviews_count": 62000,
            "opening_hours": "06:00 AM - 08:30 PM Daily",
            "entry_fee": "Free Entry",
            "best_time_to_visit": "Mahashivratri & Sunset (Divya Darshanam at 07:00 PM)",
            "nearby_station_code": "CBE",
            "distance_from_station_km": 28.5,
            "is_featured": True
        },
        {
            "name": "Marudhamalai Murugan Temple",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "category": "RELIGIOUS",
            "sub_category": "Hilltop Murugan Temple",
            "description": "Ancient 12th-century hill shrine dedicated to Lord Murugan surrounded by medicinal herbs of the Western Ghats with panoramic views of Coimbatore city.",
            "image_url": "/destinations/marudhamalai-temple.jpg",
            "address": "Marudhamalai Road, Somayampalayam, Coimbatore 641046",
            "latitude": 11.0450,
            "longitude": 76.8524,
            "rating": 4.8,
            "reviews_count": 16500,
            "opening_hours": "06:00 AM - 01:00 PM, 02:00 PM - 08:30 PM",
            "entry_fee": "Free Entry (Hill Bus ₹20)",
            "best_time_to_visit": "Thaipusam (Jan-Feb) & Early Mornings",
            "nearby_station_code": "CBE",
            "distance_from_station_km": 14.2,
            "is_featured": False
        },
        {
            "name": "Siruvani Waterfalls & Dam",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "category": "NATURE_RECREATION",
            "sub_category": "Waterfalls & Forest Reserve",
            "description": "Scenic cascade nestled in the dense reserve forests of the Western Ghats, supplying the world's second tastiest mineral-rich sweet water.",
            "image_url": "/destinations/siruvani-waterfalls.jpg",
            "address": "Sadivayal Forest Gate, Siruvani, Coimbatore 641114",
            "latitude": 10.9412,
            "longitude": 76.6914,
            "rating": 4.6,
            "reviews_count": 8900,
            "opening_hours": "10:00 AM - 03:30 PM (Forest Dept Entry)",
            "entry_fee": "₹50 Entry + Forest Safari",
            "best_time_to_visit": "September to December (Post Monsoons)",
            "nearby_station_code": "CBE",
            "distance_from_station_km": 36.0,
            "is_featured": True
        },

        # --- OOTY (The Queen of Hill Stations) ---
        {
            "name": "Ooty Botanical Gardens",
            "city": "Ooty",
            "state": "Tamil Nadu",
            "category": "NATURE_RECREATION",
            "sub_category": "Botanical Gardens & Arboreum",
            "description": "Expansive 55-acre terraced garden established in 1848 on Doddabetta slopes, housing exotic flora, a 20-million-year-old fossil tree trunk, and Italian gardens.",
            "image_url": "/destinations/ooty-botanical.jpg",
            "address": "Vannarapettai, Udhagamandalam, The Nilgiris 643002",
            "latitude": 11.4173,
            "longitude": 76.7118,
            "rating": 4.6,
            "reviews_count": 38000,
            "opening_hours": "07:00 AM - 06:30 PM Daily",
            "entry_fee": "₹40 (Adult), ₹20 (Child)",
            "best_time_to_visit": "May Flower Show & September to March",
            "nearby_station_code": "CBE",
            "distance_from_station_km": 86.0,
            "is_featured": True
        },
        {
            "name": "Ooty Lake & Boathouse",
            "city": "Ooty",
            "state": "Tamil Nadu",
            "category": "NATURE_RECREATION",
            "sub_category": "Lake & Boating",
            "description": "Picturesque 65-acre artificial lake surrounded by towering eucalyptus groves, offering motorboats, rowboats, pedal boating, and mini-train rides.",
            "image_url": "/destinations/ooty-lake.jpg",
            "address": "North Lake Road, Kathadimattam, Udhagamandalam 643004",
            "latitude": 11.4074,
            "longitude": 76.6859,
            "rating": 4.4,
            "reviews_count": 29500,
            "opening_hours": "09:00 AM - 06:00 PM Daily",
            "entry_fee": "₹15 Entry + Boating Charges",
            "best_time_to_visit": "All Year Round",
            "nearby_station_code": "CBE",
            "distance_from_station_km": 88.0,
            "is_featured": True
        },

        # --- BENGALURU ---
        {
            "name": "Bengaluru Palace",
            "city": "Bengaluru",
            "state": "Karnataka",
            "category": "ATTRACTION",
            "sub_category": "Tudor Style Royal Palace",
            "description": "Stunning 19th-century royal residence inspired by England's Windsor Castle, featuring fortified towers, stained glass, wood carvings, and royal memorabilia.",
            "image_url": "/destinations/bengaluru-palace.jpg",
            "address": "Vasanth Nagar, Bengaluru, Karnataka 560052",
            "latitude": 12.9988,
            "longitude": 77.5921,
            "rating": 4.5,
            "reviews_count": 27800,
            "opening_hours": "10:00 AM - 05:30 PM",
            "entry_fee": "₹230 (Indians), ₹460 (Foreigners)",
            "best_time_to_visit": "October to February",
            "nearby_station_code": "SBC",
            "distance_from_station_km": 4.2,
            "is_featured": True
        },
        {
            "name": "Lalbagh Botanical Garden",
            "city": "Bengaluru",
            "state": "Karnataka",
            "category": "NATURE_RECREATION",
            "sub_category": "Historic Botanical Garden & Glass House",
            "description": "240-acre garden commissioned by Hyder Ali in 1760, famous for its grand Victorian Glass House, century-old trees, and biannual flower shows.",
            "image_url": "/destinations/lalbagh-glasshouse.jpg",
            "address": "Mavalli, Bengaluru, Karnataka 560004",
            "latitude": 12.9507,
            "longitude": 77.5848,
            "rating": 4.7,
            "reviews_count": 42100,
            "opening_hours": "06:00 AM - 07:00 PM Daily",
            "entry_fee": "₹25 (Adults), Free for morning walkers (06-09 AM)",
            "best_time_to_visit": "Republic Day & Independence Day Flower Shows",
            "nearby_station_code": "SBC",
            "distance_from_station_km": 4.8,
            "is_featured": True
        }
    ]

    for p in tourist_places_data:
        p_exist = db.query(TouristPlace).filter(TouristPlace.name == p["name"]).first()
        if not p_exist:
            db.add(TouristPlace(**p))
        else:
            p_exist.image_url = p["image_url"]
            p_exist.description = p["description"]
            p_exist.opening_hours = p["opening_hours"]
            p_exist.entry_fee = p["entry_fee"]
            p_exist.distance_from_station_km = p["distance_from_station_km"]
            p_exist.nearby_station_code = p["nearby_station_code"]
    db.commit()
