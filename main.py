from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

#import pydantic forr validation
from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from database import SessionLocal, User
from auth import hash_password

app = FastAPI()

# Add CORS (allows frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins= ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],

)

#mount the sttatic folder -html,css, js
app.mount ("/static",StaticFiles(directory = "static"), name ="static")

#to get db session,
#openiing a convo with with the db
#letting an ENDPOINT USE IT
#the close after the convo ended
def get_db ():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#pydantic model for rregistration
#pydantic automatically validates id username is a string, email is a valaid format and the pass word is a string
class UserRegister(BaseModel):
    username: str
    email: EmailStr #special type that validates email format
    password: str

#padnatic model for what we send to the user
class UserResponse(BaseModel):
    id: int 
    username: str 
    email:str 

    class Config:
        from_attributes = True #allows converting SQLAlchemy to pydantic

#registration endpoint

@app.post("/auth/register", status_code = status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):

    """
    Register a new user.
    
    Steps:
    1. Check if username already exists
    2. Check if email already exists
    3. Hash the password
    4. Create user in database
    5. Return success
    """

    #check iif the username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "USERNAME ALREADY TAKEN"
        )

    #check if the email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "email already registered"
        )

    hashed_password = hash_password(user_data.password)

    #create a new user
    new_user = User(
        username = user_data.username,
        email= user_data.email,
        password_hash=hashed_password #always store the hashed password not the plain one
    )


    #add to the databse
    db.add(new_user)
    db.commit()
    db.refresh(new_user) #generates an id

    return {
        "message": "User registerd successfully",
        "User": UserResponse.from_orm(new_user)
    }

@app.get("/")
def read_root():
    return FileResponse('static/index.html')


