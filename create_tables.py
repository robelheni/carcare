#what the whole file does 
#Looks at all classes that inherit from Base (right now just User)
#Generates the SQL to create those tables
#executes it in PostgreSQL

from database import Base, engine

#tells SQLAlchemy: Take all models registered under Base and physically create them in PostgreSQL
Base.metadata.create_all(bind=engine)

print("Tables created successfully")