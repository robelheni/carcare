# Password hashing - using bcrypt directly (simpler, no passlib!)
import bcrypt

# JWT tools
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os 
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Function to hash a password
def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    Converts password to bytes, generates salt, creates hash.
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string
    return hashed.decode('utf-8')

# Function to verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain password matches the hashed version.
    """
    # Convert both to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # Check if they match
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# Function to create JWT token
def create_access_token(data: dict) -> str:
    """
    Create a JWT token with user data inside.
    """
    # Copy the data
    to_encode = data.copy()
    # Add expiration time
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    # Create and sign the token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Function to verify token
def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None