import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class TrainCatalog(Base):
    """
    Catalog of all monitored and bookable trains in the simulated railway network.
    Contains 20+ trains across South, West, North, and Central corridors.
    """
    __tablename__ = "train_catalog"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), unique=True, index=True, nullable=False)
    train_name = Column(String(150), nullable=False)
    train_type = Column(String(50), default="Superfast")  # Vande Bharat, Rajdhani, Shatabdi, Superfast, Express, Tejas
    source_station_code = Column(String(20), index=True, nullable=False)
    source_station_name = Column(String(150), nullable=False)
    destination_station_code = Column(String(20), index=True, nullable=False)
    destination_station_name = Column(String(150), nullable=False)
    departure_time = Column(String(20), nullable=False)  # HH:MM format
    arrival_time = Column(String(20), nullable=False)    # HH:MM format
    duration_hours = Column(String(30), default="5h 30m")
    distance_km = Column(Float, default=360.0)
    running_days = Column(String(60), default="Daily")  # Daily, Except Tuesday, etc.
    available_classes = Column(Text, default='["1A","2A","3A","SL"]')  # JSON list
    route_stations = Column(Text, default="[]")  # JSON list of halting stations
    base_fare_sl = Column(Float, default=240.0)
    base_fare_3a = Column(Float, default=650.0)
    base_fare_2a = Column(Float, default=950.0)
    base_fare_1a = Column(Float, default=1600.0)
    base_fare_cc = Column(Float, default=520.0)
    base_fare_ec = Column(Float, default=1100.0)
    base_fare_2s = Column(Float, default=140.0)
    is_active = Column(Boolean, default=True)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class SeatInventory(Base):
    """
    Class-wise seat availability and quota manager.
    Enforces real-time concurrency-safe booking logic.
    """
    __tablename__ = "seat_inventory"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), index=True, nullable=False)
    journey_date = Column(String(30), index=True, nullable=False)  # YYYY-MM-DD
    travel_class = Column(String(20), index=True, nullable=False)  # 1A, 2A, 3A, SL, CC, EC, 2S
    total_quota = Column(Integer, default=72)
    available_seats = Column(Integer, default=50)
    booked_seats = Column(Integer, default=22)
    rac_seats = Column(Integer, default=10)
    waiting_list = Column(Integer, default=0)
    fare_amount = Column(Float, default=650.0)
    last_updated = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_train_date_class", "train_number", "journey_date", "travel_class", unique=True),
    )


class Booking(Base):
    """
    Simulated Railway Ticket Booking Record.
    Issues unique 10-digit demo PNR, fare breakdowns, and ticket lifecycle.
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(40), unique=True, index=True, nullable=False)  # e.g., RR-BK-890123
    demo_pnr = Column(String(10), unique=True, index=True, nullable=False)            # e.g., 4829103847
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Journey specifications
    train_number = Column(String(20), index=True, nullable=False)
    train_name = Column(String(150), nullable=False)
    source_station_code = Column(String(20), nullable=False)
    source_station_name = Column(String(150), nullable=False)
    destination_station_code = Column(String(20), nullable=False)
    destination_station_name = Column(String(150), nullable=False)
    journey_date = Column(String(30), index=True, nullable=False)  # YYYY-MM-DD
    departure_time = Column(String(30), nullable=False)
    arrival_time = Column(String(30), nullable=False)
    travel_class = Column(String(20), nullable=False)  # 1A, 2A, 3A, SL, CC, EC, 2S
    quota = Column(String(20), default="GENERAL")
    
    # Financial breakdown
    passenger_count = Column(Integer, default=1)
    base_fare = Column(Float, default=0.0)
    reservation_charge = Column(Float, default=40.0)
    superfast_charge = Column(Float, default=45.0)
    gst_amount = Column(Float, default=0.0)
    total_fare = Column(Float, default=0.0)

    # Status tracking
    booking_status = Column(String(30), default="CONFIRMED")  # CONFIRMED, CANCELLED, RAC, WAITLIST
    payment_status = Column(String(30), default="PAID")        # PAID, FAILED, REFUNDED
    payment_method = Column(String(40), default="UPI")        # UPI, NET_BANKING, DEBIT_CARD, CREDIT_CARD
    transaction_id = Column(String(60), default="")
    
    # Cancellation & Refund Management
    is_cancelled = Column(Boolean, default=False)
    cancellation_reason = Column(Text, default="")
    refund_amount = Column(Float, default=0.0)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Contact information
    contact_email = Column(String(120), default="")
    contact_phone = Column(String(30), default="")
    
    # Audit & simulation
    is_simulated = Column(Boolean, default=True)
    disclaimer = Column(
        String(255), 
        default="DEMO TICKET - NOT VALID FOR ACTUAL RAILWAY TRAVEL. Simulated academic record for RailResQ."
    )
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    user = relationship("User")


class BookingPassenger(Base):
    """
    Passenger details, berth preferences, and allocated coach/seat.
    """
    __tablename__ = "booking_passengers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    passenger_name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), default="Male")  # Male, Female, Other
    berth_preference = Column(String(40), default="No Preference")  # Lower, Middle, Upper, Side Lower, Side Upper, Window
    
    # Seat Allocation Result
    allocated_coach = Column(String(20), default="B1")
    allocated_berth = Column(String(20), default="34")
    allocated_berth_type = Column(String(40), default="LOWER")
    ticket_status = Column(String(30), default="CNF")  # CNF, RAC, WL, CAN
    concession_type = Column(String(40), default="NONE")  # NONE, SENIOR_CITIZEN, STUDENT, DIVYANGJAN

    booking = relationship("Booking", back_populates="passengers")


class PaymentRecord(Base):
    """
    Safe simulated payment ledger.
    Never stores real financial credentials.
    """
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    transaction_reference = Column(String(60), unique=True, index=True, nullable=False)
    booking_reference = Column(String(40), index=True, nullable=False)
    demo_pnr = Column(String(10), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(40), default="UPI")
    status = Column(String(30), default="SUCCESS")  # SUCCESS, FAILED, REFUNDED
    gateway_reference = Column(String(60), default="")
    failure_reason = Column(String(150), default="")
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class PNRVerificationLog(Base):
    """
    Audit log for PNR lookups and cross-linking with Emergency Complaints.
    """
    __tablename__ = "pnr_verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    demo_pnr = Column(String(10), index=True, nullable=False)
    verified_by = Column(String(120), default="Guest/Passenger")
    train_number = Column(String(20), default="")
    journey_date = Column(String(30), default="")
    has_emergency_linked = Column(Boolean, default=False)
    linked_incident_id = Column(Integer, nullable=True)
    lookup_timestamp = Column(DateTime(timezone=True), default=utc_now)
