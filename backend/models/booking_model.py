from sqlalchemy import Column, Integer, String
from database.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    user_email = Column(String)
    bike_name = Column(String)
    booking_date = Column(String)
    return_date = Column(String)
    total_price = Column(Integer)
    image_url = Column(String)
    status = Column(String)
    rental_type = Column(String, default="daily")
    duration = Column(String)
    payment_status = Column(String, default="Pending")
    cancelled_at = Column(String, nullable=True)
    completed_at = Column(String, nullable=True)
