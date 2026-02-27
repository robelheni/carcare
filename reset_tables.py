# reset_tables.py
from database import Base, engine

Base.metadata.drop_all(bind=engine)  # drops ALL tables
Base.metadata.create_all(bind=engine)  # recreates tables with current model
print("Tables reset successfully!")