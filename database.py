from sqlalchemy import create_engine, Column, Integer, String, DateTime,Date, ForeignKey,Numeric, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit = False, autoflush=False, bind=engine)

Base= declarative_base()

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash=Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    #relationship to the vehicles
    vehicles = relationship("Vehicle", back_populates="user", cascade="all, delete-orphan")

#define Vehicle table
class Vehicle(Base):
    __tablename__="vehicles"

    id =Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name=Column(String(100), nullable=False)
    registration=Column(String(20), nullable=False)
    mileage=Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)  
    fuel_type = Column(String(50), nullable = True)
    created_at = Column(DateTime, default=datetime.utcnow)

    #relationship with a user
    user = relationship("User", back_populates="vehicles")

    #  Relationship to logs
    logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")

    #Relationship to remindeers
    reminders = relationship("Reminder", back_populates = "vehicle", cascade="all, delete-orphan")




class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    log_type = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    mileage = Column(Integer, nullable=False)
    cost = Column(Numeric(10, 2), nullable=True)  # Optional, decimal with 2 places
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to vehicle
    vehicle = relationship("Vehicle", back_populates="logs")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key =True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    reminder_type = Column(String(50))
    due_date = Column(Date, nullable =True)
    due_mileage = Column(Integer, nullable= True)
    is_completed = Column(Boolean, nullable=True)
    notes = Column(String(500), nullable = True)
    created_at = Column(DateTime, default = datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates = "reminders")