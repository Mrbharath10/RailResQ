import httpx
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger("railresq.routes.travel_guide")
router = APIRouter(prefix="/travel-guide", tags=["AI Travel Guide & Rail Guide"])


class TravelAskRequest(BaseModel):
    prompt: str
    destination_city: Optional[str] = "Chennai"
    travel_type: Optional[str] = "Family"  # Family, Solo, Budget, Pilgrim, Weekend


class ItineraryRequest(BaseModel):
    city: str
    days: int = 1
    budget_level: Optional[str] = "Moderate"  # Budget, Moderate, Luxury
    interests: Optional[List[str]] = ["Attractions", "Local Food", "Heritage"]


# Real station facilities directory for major railway junctions
STATION_FACILITIES_DB = {
    "MAS": {
        "name": "Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station (Chennai Central)",
        "city": "Chennai",
        "division": "Southern Railway (MAS)",
        "platforms": 12,
        "waiting_rooms": [
            {"type": "Executive Lounge (AC)", "location": "Platform 1 Concourse", "amenities": "Wi-Fi, Buffet, Recliners, Shower", "rate": "₹150 / 2 hours"},
            {"type": "Upper Class AC Waiting Hall", "location": "Platform 1 & 7", "amenities": "Charging ports, AC, Restrooms", "rate": "Complimentary with 1A/2A/3A/CC ticket"},
            {"type": "Ladies Waiting Room", "location": "Platform 1 Near RPF Desk", "amenities": "Baby feeding cubicle, Security guard", "rate": "Free"}
        ],
        "cloak_rooms": {
            "location": "Platform 1 near Moore Market Complex exit",
            "operating_hours": "24x7",
            "charges": "₹30 per package for 24 hrs (must be padlocked)"
        },
        "accessibility": {
            "wheelchairs": "Available at Station Manager Room (Platform 1)",
            "battery_operated_cars": "Available on Platform 1-12 for senior citizens (Helpline: +91 94440 19999)",
            "braille_signage": "Installed across all primary entry gates and foot overbridges"
        },
        "food_plaza": [
            {"brand": "Saravana Bhavan", "platform": "Concourse", "type": "Pure Veg South Indian"},
            {"brand": "IRCTC Jan Ahaar", "platform": "Platform 3", "type": "Budget Meals & Tea"},
            {"brand": "Subway & Cafe Coffee Day", "platform": "Platform 1", "type": "Quick Bites & Coffee"}
        ],
        "metro_connectivity": {
            "station": "Chennai Central Metro (Underground Inter-modal)",
            "lines": "Blue Line (Airport via Anna Salai) & Green Line (Koyambedu / St. Thomas Mount)",
            "walk_time": "2 minutes via subway tunnel"
        }
    },
    "MS": {
        "name": "Chennai Egmore Railway Station",
        "city": "Chennai",
        "division": "Southern Railway (MAS)",
        "platforms": 11,
        "waiting_rooms": [
            {"type": "AC Waiting Hall", "location": "Gandhi Irwin Road Concourse", "amenities": "AC, Charging, Restrooms", "rate": "Complimentary with AC ticket"},
            {"type": "General Waiting Hall", "location": "Platform 4", "amenities": "Fans, Seating", "rate": "Free"}
        ],
        "cloak_rooms": {
            "location": "Platform 4 towards Poonamallee High Road exit",
            "operating_hours": "24x7",
            "charges": "₹30 per item / 24h"
        },
        "accessibility": {
            "wheelchairs": "RPF Assistance Counter (Platform 1)",
            "battery_operated_cars": "Available upon request",
            "braille_signage": "Available"
        },
        "food_plaza": [
            {"brand": "A2B Adyar Ananda Bhavan", "platform": "Platform 1", "type": "Sweets & South Indian Snacks"},
            {"brand": "IRCTC Refreshment Room", "platform": "Platform 3", "type": "Standard Thali & Beverages"}
        ],
        "metro_connectivity": {
            "station": "Egmore Metro Station",
            "lines": "Green Line",
            "walk_time": "3 minutes via foot overbridge"
        }
    },
    "MDU": {
        "name": "Madurai Junction",
        "city": "Madurai",
        "division": "Madurai Railway Division (MDU)",
        "platforms": 8,
        "waiting_rooms": [
            {"type": "Air-Conditioned VIP Lounge", "location": "Platform 1", "amenities": "Sofa seating, TV, Wi-Fi", "rate": "₹50 / hour"},
            {"type": "Dormitory / Retiring Rooms", "location": "1st Floor Station Building", "amenities": "Beds, Clean Linen", "rate": "₹350 / 12 hours via IRCTC"}
        ],
        "cloak_rooms": {
            "location": "Platform 1 West Entry",
            "operating_hours": "05:00 AM - 11:30 PM",
            "charges": "₹30 per bag"
        },
        "accessibility": {
            "wheelchairs": "Available at Chief Commercial Inspector Office",
            "battery_operated_cars": "Available for elders",
            "braille_signage": "Present"
        },
        "food_plaza": [
            {"brand": "Murugan Idli Shop Stall", "platform": "Platform 1", "type": "Famous Fluffy Idlis & Podi"},
            {"brand": "Temple City Pure Veg", "platform": "Platform 2", "type": "South Indian Meals & Jigarthanda"}
        ],
        "metro_connectivity": {
            "station": "Madurai Central Bus Stand (Periyar Bus Stand)",
            "lines": "Direct buses to Meenakshi Temple every 3 mins",
            "walk_time": "4 minutes walk"
        }
    },
    "CBE": {
        "name": "Coimbatore Junction",
        "city": "Coimbatore",
        "division": "Salem Railway Division (SA)",
        "platforms": 6,
        "waiting_rooms": [
            {"type": "Executive Lounge", "location": "Platform 1", "amenities": "Wi-Fi, Snacks, AC", "rate": "₹100 / hour"},
            {"type": "Ladies Waiting Room", "location": "Platform 2", "amenities": "Safe waiting, Nursing area", "rate": "Free"}
        ],
        "cloak_rooms": {
            "location": "Platform 1 near Main Exit",
            "operating_hours": "24x7",
            "charges": "₹30 per bag"
        },
        "accessibility": {
            "wheelchairs": "Available at Station Superintendent room",
            "battery_operated_cars": "Available",
            "braille_signage": "Available"
        },
        "food_plaza": [
            {"brand": "Annapoorna Gowrishankar", "platform": "Platform 1", "type": "Iconic Coimbatore Sambar & Ghee Roast"},
            {"brand": "IRCTC Food Track", "platform": "Platform 3", "type": "Beverages, Biryani & Meals"}
        ],
        "metro_connectivity": {
            "station": "Gandhipuram Central Bus Stand",
            "lines": "City bus corridor route 1, 2, 7",
            "walk_time": "10 minutes by auto / city bus"
        }
    },
    "SBC": {
        "name": "Krantivira Sangolli Rayanna Bengaluru Station (Bangalore City)",
        "city": "Bengaluru",
        "division": "South Western Railway (SWR)",
        "platforms": 10,
        "waiting_rooms": [
            {"type": "IRCTC Executive Lounge", "location": "Platform 1", "amenities": "Buffet, TV, Luxury recliners", "rate": "₹150 / 2 hours"},
            {"type": "AC Waiting Hall", "location": "Platform 8", "amenities": "Charging, AC", "rate": "Complimentary with AC ticket"}
        ],
        "cloak_rooms": {
            "location": "Platform 1 Main Gate",
            "operating_hours": "24x7",
            "charges": "₹30 per bag"
        },
        "accessibility": {
            "wheelchairs": "Available 24x7",
            "battery_operated_cars": "Available on Platform 1-10",
            "braille_signage": "Installed"
        },
        "food_plaza": [
            {"brand": "Vidyarthi Bhavan Express", "platform": "Concourse", "type": "Crispy Masala Dosa & Filter Coffee"},
            {"brand": "Maiyas Refreshments", "platform": "Platform 1", "type": "Pure Veg Sweets & Meals"}
        ],
        "metro_connectivity": {
            "station": "KSR Bengaluru Metro Station (Purple Line)",
            "lines": "Direct to MG Road, Indiranagar, Whitefield",
            "walk_time": "Direct covered skywalk bridge (2 mins)"
        }
    }
}


@router.get("/rail-guide/station/{station_code}")
def get_station_rail_guide(station_code: str):
    """
    Get detailed station guide: waiting rooms, cloak rooms, accessibility, food plaza, metro.
    """
    code = station_code.upper().strip()
    if code in STATION_FACILITIES_DB:
        return STATION_FACILITIES_DB[code]

    # Return structured generic guide for any other station
    return {
        "name": f"{code} Railway Station",
        "city": code,
        "division": "Indian Railways",
        "platforms": 4,
        "waiting_rooms": [
            {"type": "AC Waiting Hall", "location": "Platform 1", "amenities": "Charging ports, Seating", "rate": "Free for AC ticket holders"},
            {"type": "General Waiting Room", "location": "Platform 1 Concourse", "amenities": "Ceiling fans, Benches", "rate": "Free"}
        ],
        "cloak_rooms": {
            "location": "Platform 1 near Station Master's Office",
            "operating_hours": "06:00 AM - 10:00 PM",
            "charges": "₹30 per bag / 24h"
        },
        "accessibility": {
            "wheelchairs": "Available on request from Commercial Supervisor",
            "battery_operated_cars": "On-demand at Platform 1",
            "braille_signage": "Available at primary booking counter"
        },
        "food_plaza": [
            {"brand": "IRCTC Refreshment Stall", "platform": "Platform 1 & 2", "type": "Hot Tea, Coffee, Packaged Meals"}
        ],
        "metro_connectivity": {
            "station": "Local City Auto & Taxi Stand",
            "lines": "Direct connection to city center",
            "walk_time": "1 minute outside Main Portico"
        }
    }


@router.post("/ask")
async def ask_travel_guide(req: TravelAskRequest):
    """
    Gemini-powered travel assistant for passenger inquiries, food advice, and local suggestions.
    """
    gemini_key = settings.GEMINI_API_KEY
    if gemini_key and len(gemini_key) > 5:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL or 'gemini-1.5-flash'}:generateContent?key={gemini_key}"
            prompt_text = (
                f"You are RailResQ Travel AI, an expert passenger travel guide for Indian Railways.\n"
                f"User destination or context: {req.destination_city}. Travel style: {req.travel_type}.\n"
                f"User Question: {req.prompt}\n\n"
                f"Provide a friendly, practical, and well-structured answer with travel tips, local foods to try, "
                f"timings, and safety recommendations for rail travelers. Keep it concise, engaging, and bulleted."
            )
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 600}
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        reply_text = candidates[0]["content"]["parts"][0]["text"]
                        return {
                            "reply": reply_text,
                            "source": "GOOGLE_GEMINI_AI",
                            "city": req.destination_city,
                            "travel_type": req.travel_type
                        }
        except Exception as e:
            logger.warning("Gemini API call failed, falling back to local travel engine: %s", e)

    # Local AI Fallback Knowledge Engine
    city_lower = (req.destination_city or "").lower()
    if "chennai" in city_lower:
        reply = (
            "**Welcome to Chennai – The Gateway of South India!**\n\n"
            "✨ **Top Highlights:**\n"
            "- **Marina Beach:** Take an evening stroll along the world's second-longest urban beach; try hot sundal & fried fish.\n"
            "- **Kapaleeshwarar Temple (Mylapore):** 7th-century Dravidian architecture with vibrant gopuram and serene tank.\n"
            "- **San Thome Cathedral:** Historic basilica built over the tomb of St. Thomas.\n\n"
            "🍛 **Must-Eat Railway Delights:** Filter coffee at Rayar's Mess, Crispy Podi Dosa at Murugan Idli Shop, Chennai Central IRCTC Jan Ahaar.\n"
            "🚇 **Transit Tip:** Use Chennai Central underground metro to connect directly to the airport (40 mins, ₹40)."
        )
    elif "madurai" in city_lower:
        reply = (
            "**Welcome to Madurai – The Ancient Temple City that Never Sleeps!**\n\n"
            "✨ **Top Highlights:**\n"
            "- **Meenakshi Amman Temple:** Stunning 14 gopurams, Hall of Thousand Pillars, and majestic sculptures.\n"
            "- **Thirumalai Nayakkar Mahal:** Indo-Saracenic palace famous for gigantic pillars and evening sound & light show.\n\n"
            "🍧 **Iconic Culinary Treats:**\n"
            "- Famous *Jigarthanda* beverage near East Gate.\n"
            "- Piping hot melt-in-mouth Idlis with 4 chutneys at Murugan Idli Shop.\n"
            "- Kari Dosa at Konar Vilas.\n\n"
            "🚉 **Transit Tip:** Madurai Junction is right next to Periyar Bus Stand; autos charge around ₹50 to Meenakshi Temple."
        )
    elif "ooty" in city_lower:
        reply = (
            "**Welcome to Ooty (Udhagamandalam) – Queen of Nilgiri Hill Stations!**\n\n"
            "✨ **Top Highlights:**\n"
            "- **Nilgiri Mountain Railway (Toy Train):** UNESCO World Heritage steam locomotive journey from Mettupalayam.\n"
            "- **Government Botanical Garden & Ooty Lake:** Beautiful boating, terraced gardens, and eucalyptus trees.\n"
            "- **Doddabetta Peak:** Highest viewpoint in the Nilgiris.\n\n"
            "🍫 **Must-Buys:** Fresh homemade chocolates, Nilgiri green tea, and aromatic eucalyptus oil."
        )
    else:
        reply = (
            f"**Travel Guide for {req.destination_city or 'Your Journey'}:**\n\n"
            "✨ **Quick Travel Advice:**\n"
            "- Ensure your PNR ticket is downloaded or confirmed via RailResQ PNR verification.\n"
            "- Utilize 24x7 cloakrooms at major junction stations to explore the city luggage-free.\n"
            "- Enjoy regional specialty foods from station partner eateries using our Food Ordering module.\n"
            "- In case of emergency or safety questions, reach out immediately via the 112 / 139 hotline."
        )

    return {
        "reply": reply,
        "source": "LOCAL_KNOWLEDGE_ENGINE",
        "city": req.destination_city,
        "travel_type": req.travel_type
    }


@router.post("/itinerary")
def generate_itinerary(req: ItineraryRequest):
    """
    Generate customized 1-Day or 2-Day travel itinerary with time slots.
    """
    city = req.city.strip().title()

    if "Chennai" in city:
        plan_day1 = [
            {"time": "07:30 AM", "activity": "Traditional South Indian breakfast & Filter Coffee at Mylapore.", "location": "Mylapore", "icon": "Coffee"},
            {"time": "09:00 AM", "activity": "Explore Kapaleeshwarar Temple and ancient agraharam streets.", "location": "Kapaleeshwarar Temple", "icon": "MapPin"},
            {"time": "12:30 PM", "activity": "Authentic South Indian Banana Leaf Thali lunch.", "location": "Saravana Bhavan / Sangeetha", "icon": "Utensils"},
            {"time": "02:30 PM", "activity": "Visit Government Museum & National Art Gallery.", "location": "Egmore", "icon": "Camera"},
            {"time": "05:00 PM", "activity": "Sunset stroll at Marina Beach, lighthouse view, and seaside street snacks.", "location": "Marina Beach", "icon": "Sun"},
            {"time": "08:30 PM", "activity": "Dinner and shopping along Pondy Bazaar, T. Nagar.", "location": "T. Nagar", "icon": "ShoppingBag"}
        ]
        plan_day2 = [
            {"time": "08:00 AM", "activity": "Drive to Mahabalipuram (Shore Temple, Pancha Rathas & Butter Ball).", "location": "Mahabalipuram", "icon": "Compass"},
            {"time": "01:00 PM", "activity": "Fresh seafood / Coastal lunch along East Coast Road (ECR).", "location": "ECR Beachside", "icon": "Utensils"},
            {"time": "04:30 PM", "activity": "Visit DakshinaChitra Heritage Museum showcasing South Indian folk architecture.", "location": "DakshinaChitra", "icon": "Landmark"},
            {"time": "07:30 PM", "activity": "Evening coffee and music at Besant Nagar Elliot's Beach.", "location": "Besant Nagar Beach", "icon": "Smile"}
        ]
    elif "Madurai" in city:
        plan_day1 = [
            {"time": "07:00 AM", "activity": "Fluffy steamed idlis with coriander and coconut chutneys.", "location": "Murugan Idli Shop", "icon": "Coffee"},
            {"time": "08:30 AM", "activity": "Darshan at Sri Meenakshi Sundareswarar Temple and Thousand Pillars hall.", "location": "Meenakshi Temple", "icon": "MapPin"},
            {"time": "01:00 PM", "activity": "Famous Madurai feast lunch.", "location": "Town Hall Road", "icon": "Utensils"},
            {"time": "03:30 PM", "activity": "Tour Thirumalai Nayakkar Palace - magnificent 17th-century Dravidian architecture.", "location": "Thirumalai Palace", "icon": "Landmark"},
            {"time": "06:00 PM", "activity": "Relish world-famous Famous Madurai Jigarthanda near East Tower.", "location": "East Avani Moola St", "icon": "Smile"},
            {"time": "07:30 PM", "activity": "Shop authentic Madurai Sungudi cotton sarees.", "location": "Chithirai Street Bazaar", "icon": "ShoppingBag"}
        ]
        plan_day2 = [
            {"time": "08:00 AM", "activity": "Visit Alagar Kovil temple nestled in lush green hills.", "location": "Alagar Hills", "icon": "Compass"},
            {"time": "11:30 AM", "activity": "Gandhi Memorial Museum & Freedom Struggle Archives.", "location": "Tamukkam Grounds", "icon": "Camera"},
            {"time": "02:00 PM", "activity": "Lunch at Amma Mess for traditional Madurai delicacies.", "location": "Amma Mess", "icon": "Utensils"},
            {"time": "05:00 PM", "activity": "Vandiyur Mariamman Teppakulam temple tank walk.", "location": "Teppakulam", "icon": "Sun"}
        ]
    else:
        plan_day1 = [
            {"time": "08:00 AM", "activity": "Local breakfast at junction restaurant and pickup orientation.", "location": f"{city} Station Hub", "icon": "Coffee"},
            {"time": "09:30 AM", "activity": "Explore historic landmarks and central museum.", "location": f"{city} Historic Center", "icon": "Landmark"},
            {"time": "01:00 PM", "activity": "Traditional regional thali lunch.", "location": f"{city} Market Eatery", "icon": "Utensils"},
            {"time": "04:00 PM", "activity": "Visit prominent park or lakeside promenade.", "location": f"{city} Nature Park", "icon": "Camera"},
            {"time": "07:00 PM", "activity": "Local shopping and evening dinner.", "location": f"{city} High Street", "icon": "ShoppingBag"}
        ]
        plan_day2 = [
            {"time": "08:30 AM", "activity": "Excursion to nearby temple, fort or scenic viewpoint.", "location": f"{city} Scenic Outskirts", "icon": "Compass"},
            {"time": "01:00 PM", "activity": "Authentic regional lunch.", "location": f"{city} Heritage Bistro", "icon": "Utensils"},
            {"time": "04:30 PM", "activity": "Artisan souvenir shopping.", "location": f"{city} Handicraft Market", "icon": "Smile"}
        ]

    days_plan = [{"day": 1, "title": f"Day 1: Essence of {city}", "stops": plan_day1}]
    if req.days >= 2:
        days_plan.append({"day": 2, "title": f"Day 2: Heritage & Scenic Discovery", "stops": plan_day2})

    return {
        "city": city,
        "days": req.days,
        "budget_level": req.budget_level,
        "itinerary": days_plan,
        "disclaimer": "AI-generated passenger travel guide by RailResQ Companion."
    }
