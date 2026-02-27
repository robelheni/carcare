from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
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