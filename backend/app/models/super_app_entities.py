import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


# ==============================================================================
# MODULE 3: FOOD ORDERING PLATFORM (Swiggy / Zomato Inspired)
# ==============================================================================

class Restaurant(Base):
    """
    Partner restaurants located near railway stations or en route corridors.
    """
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    station_code = Column(String(20), index=True, nullable=False)  # MAS, MS, MDU, CBE, SBC, etc.
    city = Column(String(100), nullable=False)
    cuisine_type = Column(String(120), default="South Indian, North Indian, Biryani")
    rating = Column(Float, default=4.4)
    delivery_time_mins = Column(Integer, default=25)
    min_order_amount = Column(Float, default=150.0)
    price_for_two = Column(Float, default=350.0)
    address = Column(String(255), nullable=False)
    image_url = Column(String(255), default="")
    is_veg_only = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    operating_hours = Column(String(60), default="07:00 AM - 11:30 PM")
    phone_number = Column(String(40), default="+91 94440 12345")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    food_items = relationship("FoodItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("FoodOrder", back_populates="restaurant")


class FoodItem(Base):
    """
    Menu items available in partner restaurants.
    """
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    category = Column(String(60), default="Main Course")  # Biryani, Starters, Thali, South Indian, Snacks, Beverages, Desserts
    is_veg = Column(Boolean, default=True)
    image_url = Column(String(255), default="")
    is_available = Column(Boolean, default=True)
    spice_level = Column(String(20), default="Medium")  # Mild, Medium, Spicy
    created_at = Column(DateTime(timezone=True), default=utc_now)

    restaurant = relationship("Restaurant", back_populates="food_items")


class FoodOrder(Base):
    """
    Food orders placed by passengers with station, train, coach & berth delivery.
    """
    __tablename__ = "food_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_reference = Column(String(40), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    delivery_station_code = Column(String(20), nullable=False)
    train_number = Column(String(20), default="")
    coach_number = Column(String(20), default="")
    seat_berth = Column(String(20), default="")
    passenger_name = Column(String(120), nullable=False)
    passenger_phone = Column(String(40), nullable=False)
    delivery_address = Column(String(255), default="")
    items_json = Column(Text, nullable=False)  # JSON list of [{id, name, price, quantity, is_veg}]
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=30.0)
    gst_amount = Column(Float, default=15.0)
    total_amount = Column(Float, nullable=False)
    order_status = Column(String(40), default="PLACED")  # PLACED, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    payment_method = Column(String(30), default="UPI_SIMULATED")
    payment_status = Column(String(30), default="PAID")
    estimated_delivery_time = Column(String(30), default="30 Mins")
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    restaurant = relationship("Restaurant", back_populates="orders")


# ==============================================================================
# MODULE 4: GROCERY & ESSENTIALS (Blinkit / Instamart Inspired)
# ==============================================================================

class GroceryProduct(Base):
    """
    Grocery, snacks, dairy, personal care, and travel essentials.
    """
    __tablename__ = "grocery_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(80), nullable=False, index=True)  # Fruits, Vegetables, Snacks, Beverages, Dairy, Bakery, Personal Care, Travel Essentials, Packaged Food
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    unit = Column(String(40), default="1 unit")  # 500g, 1 pack, 250ml, 1 bottle
    brand = Column(String(80), default="Essential")
    image_url = Column(String(255), default="")
    in_stock = Column(Boolean, default=True)
    discount_pct = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class GroceryOrder(Base):
    """
    Grocery order placed by passenger for delivery to home, station, or hotel.
    """
    __tablename__ = "grocery_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_reference = Column(String(40), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    delivery_station_code = Column(String(20), default="")
    delivery_address = Column(String(255), nullable=False)
    recipient_name = Column(String(120), nullable=False)
    recipient_phone = Column(String(40), nullable=False)
    items_json = Column(Text, nullable=False)  # JSON array
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=25.0)
    total_amount = Column(Float, nullable=False)
    order_status = Column(String(40), default="CONFIRMED")  # CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED
    payment_method = Column(String(30), default="UPI_SIMULATED")
    payment_status = Column(String(30), default="PAID")
    estimated_delivery_mins = Column(Integer, default=15)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ==============================================================================
# MODULES 5 & 6: POLICE, AMBULANCE & MEDICAL DIRECTORY
# ==============================================================================

class EmergencyFacility(Base):
    """
    Directory of nearby police stations, hospitals, ambulance services, and fire stations.
    """
    __tablename__ = "emergency_facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    facility_type = Column(String(40), nullable=False, index=True)  # POLICE, HOSPITAL, AMBULANCE_PROVIDER, FIRE_STATION
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(80), default="Tamil Nadu")
    station_code = Column(String(20), index=True, default="")  # Nearest railway station
    address = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False)
    emergency_helpline = Column(String(20), default="112")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance_km = Column(Float, default=1.5)
    is_24x7 = Column(Boolean, default=True)
    has_icu = Column(Boolean, default=True)
    ambulances_available = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ==============================================================================
# MODULE 7: LOCAL TRANSPORTATION (Rapido / Auto / Cab Inspired)
# ==============================================================================

class TransportVehicle(Base):
    """
    Local transport fleet available around railway stations.
    """
    __tablename__ = "transport_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String(40), nullable=False)  # BIKE_TAXI, AUTO, MINI_CAB, SEDAN, SUV
    name = Column(String(100), nullable=False)  # Rapido Bike, City Auto, Quick Cab
    city = Column(String(100), nullable=False)
    station_code = Column(String(20), index=True, default="")
    base_fare = Column(Float, default=30.0)
    per_km_rate = Column(Float, default=12.0)
    eta_mins = Column(Integer, default=4)
    capacity_passengers = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    icon_name = Column(String(40), default="Bike")


class RideBooking(Base):
    """
    Simulated ride request placed by passenger for local transit.
    """
    __tablename__ = "ride_bookings"

    id = Column(Integer, primary_key=True, index=True)
    ride_reference = Column(String(40), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_type = Column(String(40), nullable=False)
    pickup_location = Column(String(255), nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    drop_location = Column(String(255), nullable=False)
    drop_lat = Column(Float, nullable=True)
    drop_lng = Column(Float, nullable=True)
    distance_km = Column(Float, default=5.0)
    estimated_duration_mins = Column(Integer, default=18)
    estimated_fare = Column(Float, nullable=False)
    driver_name = Column(String(100), default="Murugan S.")
    driver_phone = Column(String(40), default="+91 98401 99887")
    vehicle_number = Column(String(40), default="TN-01-AB-1234")
    otp_code = Column(String(10), default="4812")
    ride_status = Column(String(40), default="DRIVER_ASSIGNED")  # REQUESTED, DRIVER_ASSIGNED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
    payment_method = Column(String(30), default="UPI_SIMULATED")
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ==============================================================================
# MODULE 8: AI TOURIST DISCOVERY (Explore Destinations)
# ==============================================================================

class TouristPlace(Base):
    """
    Comprehensive directory of tourist places, temples, nature spots,
    famous foods, and shopping destinations across cities.
    """
    __tablename__ = "tourist_places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)  # Chennai, Madurai, Coimbatore, Bengaluru, Ooty, etc.
    state = Column(String(80), default="Tamil Nadu")
    category = Column(String(60), nullable=False, index=True)  # ATTRACTION, RELIGIOUS, NATURE_RECREATION, FOOD_DINING, SHOPPING, TRAVEL_FACILITY
    sub_category = Column(String(80), default="Monument")  # Temple, Beach, Waterfall, Zoo, Museum, Iconic Eatery, Market
    description = Column(Text, nullable=False)
    image_url = Column(String(255), default="")
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating = Column(Float, default=4.6)
    reviews_count = Column(Integer, default=1250)
    opening_hours = Column(String(80), default="06:00 AM - 09:00 PM")
    entry_fee = Column(String(60), default="Free")
    best_time_to_visit = Column(String(100), default="October to March")
    nearby_station_code = Column(String(20), default="")
    distance_from_station_km = Column(Float, default=3.5)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class SavedWishlistPlace(Base):
    """
    Saved/bookmarked places in passenger's personal travel wishlist.
    """
    __tablename__ = "saved_wishlist_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("tourist_places.id"), nullable=False)
    notes = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    place = relationship("TouristPlace")


# ==============================================================================
# MODULE 13: MODULAR API INTEGRATION REGISTRY
# ==============================================================================

class APIIntegrationAdapter(Base):
    """
    Registry for external service integration adapters.
    Status: LIVE, DEMO, PENDING_APPROVAL, UNAVAILABLE
    """
    __tablename__ = "api_integration_adapters"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(100), unique=True, index=True, nullable=False)  # e.g. SWIGGY_FOOD, ZOMATO, BLINKIT, INSTAMART, RAPIDO, GEMINI_AI, 112_EMERGENCY, GOOGLE_PLACES, IRCTC
    provider_name = Column(String(120), nullable=False)
    category = Column(String(60), nullable=False)  # RAILWAY, FOOD, GROCERY, TRANSPORT, TOURISM, EMERGENCY, AI
    adapter_status = Column(String(40), default="DEMO")  # LIVE, DEMO, PENDING_APPROVAL, UNAVAILABLE
    endpoint_url = Column(String(255), default="")
    last_ping_status = Column(String(40), default="HEALTHY")
    latency_ms = Column(Integer, default=45)
    notes = Column(Text, default="Operational in simulated academic mode.")
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
