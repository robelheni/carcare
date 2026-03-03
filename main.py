from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from fastapi import Security


from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session
from datetime import datetime, date

from database import SessionLocal, User, Vehicle, MaintenanceLog
from auth import hash_password, verify_password, create_access_token, verify_token




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

#create a secuity scheme

security = HTTPBearer()
#dependency to grt the current user form token
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):

    """
    Extract user from JWT token.
    
    This function runs BEFORE protected endpoints.
    It checks the token and returns the current user.
    
    Steps:
    1. Get token from Authorization header
    2. Verify token
    3. Extract user_id from token
    4. Find user in database
    5. Return user object
    """

    #get token form credentials
    
    token = credentials.credentials
    payload= verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail ="invalid or expired token"
        )
    
    #extract user_id from token
    user_id =payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "invalid token payload"
        )
    
    #find user in database
    user = db.query(User).filter(User.id==user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "user not found"
        )

    #return the user object
    return user



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


class MaintenanceLogCreate(BaseModel):
    #defines the data we expect when adding a log


    log_type: str
    date: date
    mileage: int
    cost: float = None
    notes: str = None

class MaintenanceLogResponse(BaseModel):
    #defines what we send back to the user.

    id: int
    vehicle_id : int
    date: date
    mileage: int
    cost: float = None
    notes: str = None
    created_at: datetime
    log_type: str

    model_config = ConfigDict(from_attributes=True)

    

#dashboard statistics endpoints
@app.get("/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    get dashboard statistica for current user

    returns: 
    -total vehicles
    total maintenance logs
    total spent
    recent logs

    """

    #get all user's vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()
    vehicle_ids = [v.id for v in vehicles]

    #Count total logs
    total_logs = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id.in_(vehicle_ids)
    ).count()

    #calculate total spent
    from sqlalchemy import func

    total_spent = db.query(func.sum(MaintenanceLog.cost)).filter(
        MaintenanceLog.vehicle_id.in_(vehicle_ids)
    ).scalar() or 0


    #get recent logs( last 5)
    recent_logs = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id.in_(vehicle_ids)
    ).order_by(MaintenanceLog.date.desc()).limit(5).all()

    #build response with vehicle names
    recent_activity =[]
    for log in recent_logs:
        vehicle = db.query(Vehicle).filter(Vehicle.id ==log.vehicle_id).first()
        recent_activity.append({
            "log_type": log.log_type,
            "vehicle_name":vehicle.name if vehicle else "unknown",
            "date": log.date,
            "cost": log.cost
        })

    return {
        "total_vehicles": len(vehicles),
        "total_logs": total_logs,
        "total_spent": float(total_spent),
        "recent_activity": recent_activity   
        }






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

#padantic model for login, defines what does we expect for login
class UserLogin(BaseModel):
    username:str
    password:str

#pydantic model for creating a vehicle
class VehicleCreate(BaseModel):
    #defines what we expect when addin a vehicle
    name:str
    registration:str =None #optional
    mileage:int
    year: int =None #optional
    fuel_type: str =None #optional

#pydantic model for vehicle response
class VehicleResponse(BaseModel):
    #defines what we send back to the user.

    id: int
    user_id: int
    name: str
    registration: str =None
    mileage: int
    year: int =None
    fuel_type: str =None
    created_at: datetime

    class Config:
        from_attributes =True

#Loogin endpoint
@app.post("/auth/login")
def login(login_data:UserLogin, db:Session = Depends(get_db)):
    """
    Login a user and return a JWT token.
    
    Steps:
    1. Find user by username
    2. Verify password
    3. Create JWT token
    4. Return token
    """

    #let's find the  user
    user = db.query(User).filter(User.username == login_data.username).first()

    if not user:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid username or password"
        )
    
    #verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid username or password"
        )

    #create JWT token
    token_data = {
        "user_id": user.id,
        "username": user.username
    }
    access_token = create_access_token(token_data)

    #return token
    return{
        "access_token": access_token,
        "token_type":"bearer",
        "username":user.username
    }

@app.post("/vehicles", status_code=status.HTTP_201_CREATED)
def add_vehicle(
    vehicle_data: VehicleCreate,
    current_user:User = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    """
    Add a new vehicle for the current user.
    
    Steps:
    1. Get current user (from token)
    2. Create vehicle linked to this user
    3. Save to database
    4. Return vehicle
    """

    new_vehicle = Vehicle(
        user_id = current_user.id, #link to the current user
        name = vehicle_data.name,
        registration=vehicle_data.registration,
        mileage=vehicle_data.mileage,
        year=vehicle_data.year,
        fuel_type=vehicle_data.fuel_type
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return {
        "message":"vehicle added succesfully",
        "vehicle": VehicleResponse.from_orm(new_vehicle)
    }


#get all vehicles for current user
@app.get("/vehicles")
def get_vehicles(
    current_user: User = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    vehicles=db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()

    return{
        "vehicles":[VehicleResponse.from_orm(v) for v in vehicles]
    }

# Delete vehicle endpoint
@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a vehicle.
    
    Steps:
    1. Get current user (from token)
    2. Find vehicle by ID
    3. Check if user owns this vehicle
    4. Delete from database
    5. Return success
    """
    
    # Find vehicle by ID
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    # If vehicle doesn't exist
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # CRITICAL: Check if user owns this vehicle
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't own this vehicle"
        )
    
    # Delete vehicle
    db.delete(vehicle)
    db.commit()
    
    return {
        "message": "Vehicle deleted successfully"
    }

@app.post("/vehicles/{vehicle_id}/logs", status_code = status.HTTP_201_CREATED)
def add_maintenance_log(
    vehicle_id: int,
    log_data: MaintenanceLogCreate,
    current_user: User = Depends(get_current_user),
    db:Session = Depends(get_db)

):

    # Find vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Check authorization
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't own this vehicle"
        )

        # Create log
    new_log = MaintenanceLog(
        vehicle_id=vehicle_id,
        log_type=log_data.log_type,
        date=log_data.date,
        mileage=log_data.mileage,
        cost=log_data.cost,
        notes=log_data.notes
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "message": "Maintenance log added successfully",
        "log": MaintenanceLogResponse.from_orm(new_log)
    }

@app.get("/vehicles/{vehicle_id}/logs")
def get_vehicle_logs(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    #get all maintenance logs for a vehicle

    #find vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id ==vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Check authorization
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't own this vehicle"
        )

    # Get logs, ordered by date (newest first)
    logs = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == vehicle_id
    ).order_by(MaintenanceLog.date.desc()).all()

    return {
        "logs": [MaintenanceLogResponse.from_orm(log) for log in logs]
    }

@app.delete("/logs/{log_id}")
def delete_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session =Depends(get_db)
):

    #find log
    log = db.query (MaintenanceLog).filter(MaintenanceLog.id == log_id).first()

    if not log: 
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Log not found"
        )

    #pdate fields
    log.log_type = log_data.log_type
    log.date = log_date.date
    log.mileage = log_data.mileage
    log.cost = log_data.cost
    log.notes = log_data.notes

    #save
    db.commit()
    db.refresh(log)

    return {
        "message": "log updated succesfully",
        "log" : MaintenanceLogResponse.from_orm(log)
    }

    #find vehicle to check ownership
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()

    #check authorization
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You dont own this log"

        )

    db.delete(log)
    db.commit()

    return {
        "message": "Log deleted successfully"
    }

@app.put("/logs/{log_id}")
def update_log(
    log_id: int,
    log_data: MaintenanceLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a maintenance log.
    """
    
    # Find log
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )
    
    # Find vehicle to check ownership
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
    
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't own this log"
        )
    
    # Update fields
    log.log_type = log_data.log_type
    log.date = log_data.date
    log.mileage = log_data.mileage
    log.cost = log_data.cost
    log.notes = log_data.notes
    
    # Save
    db.commit()
    db.refresh(log)
    
    return {
        "message": "Log updated successfully",
        "log": MaintenanceLogResponse.from_orm(log)
    }

@app.put("/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session=Depends(get_db)

):

    #find the vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    #if it doesn't exist
    if not vehicle:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Vehicle not found"
        )

    #cehck ownership
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "you don't own this vehicle"
        )

    #update the fields
    vehicle.name = vehicle_data.name
    vehicle.registration = vehicle_data.registration
    vehicle.mileage = vehicle_data.mileage
    vehicle.year = vehicle_data.year
    vehicle.fuel_type = vehicle_data.fuel_type

    #save changes
    db.commit()
    db.refresh(vehicle)

    return{
        "message": "vehicle updated successfully",
        "vehicle": VehicleResponse.from_orm(vehicle)
    }




@app.get("/")
def read_root():
    return FileResponse('static/index.html')


@app.get("/login")
def login_page():
    return FileResponse('static/login.html')

@app.get("/dashboard")
def dashboard_page():
    return FileResponse('static/dashboard.html')

@app.get("/vehicle/{vehicle_id}")
def vehicle_page(vehicle_id: int):
    return FileResponse('static/vehicle.html')