"""
MongoDB User Manager - Handles user authentication and management with MongoDB
"""
import time
import uuid
import hashlib
import os
from typing import Dict, List, Any, Optional
from mongodb_manager import get_mongodb
from pymongo.errors import DuplicateKeyError

class MongoUserManager:
    """
    Manages user accounts and authentication using MongoDB
    """
    def __init__(self):
        self.mongodb = get_mongodb()
        self.users_collection = self.mongodb.get_collection("users")
        self.sessions_collection = self.mongodb.get_collection("sessions")
        
        if not self.mongodb.is_connected():
            print("❌ MongoDB not connected - User Manager will not work properly")
        else:
            print("✅ MongoDB User Manager initialized successfully")
    
    def register_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user"""
        if not self.mongodb.is_connected():
            raise ValueError("Database connection not available")
        
        try:
            # Check if username or email already exists
            existing_user = self.users_collection.find_one({
                "$or": [
                    {"username": {"$regex": f"^{username}$", "$options": "i"}},
                    {"email": {"$regex": f"^{email}$", "$options": "i"}}
                ]
            })
            
            if existing_user:
                if existing_user.get("username", "").lower() == username.lower():
                    raise ValueError("Username already exists")
                else:
                    raise ValueError("Email already exists")
            
            # Create user ID and hash password
            user_id = str(uuid.uuid4())
            timestamp = time.time()
            password_hash = self._hash_password(password)
            
            # Create user document
            user_doc = {
                "_id": user_id,
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "created_at": timestamp,
                "last_login": timestamp,
                "auth_tokens": []
            }
            
            # Insert user into database
            self.users_collection.insert_one(user_doc)
            
            # Create and store auth token
            auth_token = self._generate_auth_token()
            self._store_auth_token(user_id, auth_token)
            
            print(f"✅ User registered successfully: {username} (ID: {user_id})")
            
            # Return user data without password hash
            return {
                "id": user_id,
                "username": username,
                "email": email,
                "created_at": timestamp,
                "last_login": timestamp,
                "auth_token": auth_token
            }
            
        except DuplicateKeyError:
            raise ValueError("Username or email already exists")
        except Exception as e:
            print(f"❌ Error registering user: {e}")
            raise ValueError(f"Registration failed: {str(e)}")
    
    def login_user(self, username: str, password: str) -> Dict[str, Any]:
        """Login a user"""
        if not self.mongodb.is_connected():
            raise ValueError("Database connection not available")
        
        try:
            # Find user by username (case-insensitive)
            user_doc = self.users_collection.find_one({
                "username": {"$regex": f"^{username}$", "$options": "i"}
            })
            
            if not user_doc:
                raise ValueError("Invalid username or password")
            
            # Verify password
            if not self._verify_password(password, user_doc["password_hash"]):
                raise ValueError("Invalid username or password")
            
            # Update last login
            timestamp = time.time()
            self.users_collection.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"last_login": timestamp}}
            )
            
            # Create and store new auth token
            auth_token = self._generate_auth_token()
            self._store_auth_token(user_doc["_id"], auth_token)
            
            print(f"✅ User logged in successfully: {username} (ID: {user_doc['_id']})")
            
            # Return user data without password hash
            return {
                "id": user_doc["_id"],
                "username": user_doc["username"],
                "email": user_doc["email"],
                "created_at": user_doc["created_at"],
                "last_login": timestamp,
                "auth_token": auth_token
            }
            
        except ValueError:
            raise
        except Exception as e:
            print(f"❌ Error during login: {e}")
            raise ValueError(f"Login failed: {str(e)}")
    
    def get_user_by_token(self, auth_token: str) -> Optional[Dict[str, Any]]:
        """Get user by auth token"""
        if not self.mongodb.is_connected():
            return None
        
        try:
            # Find user with this auth token
            user_doc = self.users_collection.find_one({
                "auth_tokens.token": auth_token
            })
            
            if not user_doc:
                return None
            
            # Check if token is still valid (24 hours)
            token_data = None
            for token in user_doc.get("auth_tokens", []):
                if token["token"] == auth_token:
                    token_data = token
                    break
            
            if not token_data:
                return None
            
            # Check token expiry (24 hours = 86400 seconds)
            if time.time() - token_data["created_at"] > 86400:
                # Remove expired token
                self.users_collection.update_one(
                    {"_id": user_doc["_id"]},
                    {"$pull": {"auth_tokens": {"token": auth_token}}}
                )
                return None
            
            # Return user data without password hash and tokens
            return {
                "id": user_doc["_id"],
                "username": user_doc["username"],
                "email": user_doc["email"],
                "created_at": user_doc["created_at"],
                "last_login": user_doc["last_login"]
            }
            
        except Exception as e:
            print(f"❌ Error getting user by token: {e}")
            return None
    
    def logout_user(self, auth_token: str) -> bool:
        """Logout a user by removing their auth token"""
        if not self.mongodb.is_connected():
            return False
        
        try:
            result = self.users_collection.update_one(
                {"auth_tokens.token": auth_token},
                {"$pull": {"auth_tokens": {"token": auth_token}}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"❌ Error during logout: {e}")
            return False
    
    def _store_auth_token(self, user_id: str, auth_token: str):
        """Store auth token for user"""
        try:
            # Clean up old tokens (keep only last 5)
            user_doc = self.users_collection.find_one({"_id": user_id})
            if user_doc and len(user_doc.get("auth_tokens", [])) >= 5:
                # Remove oldest tokens
                self.users_collection.update_one(
                    {"_id": user_id},
                    {"$pop": {"auth_tokens": -1}}  # Remove from beginning (oldest)
                )
            
            # Add new token
            token_data = {
                "token": auth_token,
                "created_at": time.time()
            }
            
            self.users_collection.update_one(
                {"_id": user_id},
                {"$push": {"auth_tokens": token_data}}
            )
            
        except Exception as e:
            print(f"❌ Error storing auth token: {e}")
    
    def _hash_password(self, password: str) -> str:
        """Hash a password"""
        salt = os.urandom(32)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )
        return salt.hex() + ':' + key.hex()
    
    def _verify_password(self, password: str, stored_hash: str) -> bool:
        """Verify a password against a stored hash"""
        try:
            salt_hex, key_hex = stored_hash.split(':')
            salt = bytes.fromhex(salt_hex)
            stored_key = bytes.fromhex(key_hex)
            
            key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt,
                100000
            )
            
            return key == stored_key
        except Exception:
            return False
    
    def _generate_auth_token(self) -> str:
        """Generate a new auth token"""
        return str(uuid.uuid4())
    
    def get_user_stats(self) -> Dict[str, Any]:
        """Get user statistics"""
        if not self.mongodb.is_connected():
            return {"error": "Database not connected"}
        
        try:
            total_users = self.users_collection.count_documents({})
            active_sessions = self.users_collection.count_documents({
                "auth_tokens": {"$exists": True, "$ne": []}
            })
            
            return {
                "total_users": total_users,
                "active_sessions": active_sessions
            }
            
        except Exception as e:
            print(f"❌ Error getting user stats: {e}")
            return {"error": str(e)}