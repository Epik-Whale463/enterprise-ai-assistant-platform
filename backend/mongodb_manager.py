"""
MongoDB Manager - Handles MongoDB connections and operations with proper SSL settings
"""
import os
import time
import ssl
from typing import Dict, List, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
import logging

load_dotenv()

class MongoDBManager:
    """MongoDB connection and operations manager"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.connected = False
        self._connection_attempts = 0
        self._max_attempts = 3
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize MongoDB connection with multiple strategies"""
        mongodb_uri = os.getenv("MONGODB_URI")
        database_name = os.getenv("MONGODB_DATABASE", "ai_assistant")
        
        if not mongodb_uri:
            print("❌ MongoDB URI not found in environment variables")
            return
        
        print("🔄 Connecting to MongoDB...")
        
        # Use the same connection settings that worked in the test
        connection_strategies = [
            {
                "name": "Working Strategy (60s timeouts)",
                "config": {
                    "serverSelectionTimeoutMS": 30000,  # 30 seconds
                    "connectTimeoutMS": 60000,          # 60 seconds  
                    "socketTimeoutMS": 60000,           # 60 seconds
                    "retryWrites": True
                }
            },
            {
                "name": "Alternative Strategy (longer timeouts)",
                "config": {
                    "serverSelectionTimeoutMS": 45000,  # 45 seconds
                    "connectTimeoutMS": 90000,          # 90 seconds  
                    "socketTimeoutMS": 90000,           # 90 seconds
                    "retryWrites": True,
                    "maxPoolSize": 10,
                    "minPoolSize": 1
                }
            },
            {
                "name": "Fallback Strategy (basic config)",
                "config": {
                    "serverSelectionTimeoutMS": 60000,  # 60 seconds
                    "connectTimeoutMS": 120000,         # 120 seconds  
                    "socketTimeoutMS": 120000           # 120 seconds
                }
            }
        ]
        
        for strategy in connection_strategies:
            try:
                print(f"🔄 Trying {strategy['name']}...")
                
                self.client = MongoClient(mongodb_uri, **strategy['config'])
                
                # Test the connection with a ping
                result = self.client.admin.command('ping')
                print(f"✅ Ping successful: {result}")
                
                # Get database
                self.db = self.client[database_name]
                self.connected = True
                
                print(f"✅ Successfully connected to MongoDB database: {database_name}")
                print(f"✅ Using strategy: {strategy['name']}")
                
                # Create indexes for better performance
                self._create_indexes()
                
                # Test database access
                try:
                    collections = self.db.list_collection_names()
                    print(f"✅ Database access confirmed. Collections: {len(collections)}")
                except Exception as e:
                    print(f"⚠️ Warning: Could not list collections: {e}")
                
                return  # Success! Exit the function
                
            except Exception as e:
                print(f"❌ {strategy['name']} failed: {e}")
                if self.client:
                    try:
                        self.client.close()
                    except:
                        pass
                    self.client = None
                self.connected = False
                continue
        
        # All strategies failed
        print("❌ All MongoDB connection strategies failed")
        self.connected = False
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Only create indexes if we're connected
            if not self.connected or self.db is None:
                return
            
            print("🔧 Creating MongoDB indexes...")
            
            # Users collection indexes
            users_collection = self.db.users
            try:
                users_collection.create_index("username", unique=True)
                users_collection.create_index("email", unique=True)
                users_collection.create_index("auth_tokens.token")
                print("✅ Users collection indexes created")
            except Exception as e:
                print(f"⚠️ Warning: Could not create users indexes: {e}")
            
            # Sessions collection indexes
            sessions_collection = self.db.sessions
            try:
                sessions_collection.create_index("user_id")
                sessions_collection.create_index("created_at")
                sessions_collection.create_index([("user_id", 1), ("created_at", -1)])
                print("✅ Sessions collection indexes created")
            except Exception as e:
                print(f"⚠️ Warning: Could not create sessions indexes: {e}")
            
            # Messages collection indexes
            messages_collection = self.db.messages
            try:
                messages_collection.create_index("session_id")
                messages_collection.create_index("timestamp")
                messages_collection.create_index([("session_id", 1), ("timestamp", 1)])
                print("✅ Messages collection indexes created")
            except Exception as e:
                print(f"⚠️ Warning: Could not create messages indexes: {e}")
            
            print("✅ MongoDB indexes creation completed")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create indexes: {e}")
    
    def get_collection(self, collection_name: str):
        """Get a MongoDB collection"""
        if not self.connected or self.db is None:
            print(f"⚠️ Warning: Cannot get collection '{collection_name}' - not connected to MongoDB")
            return None
        
        try:
            collection = self.db[collection_name]
            # Test the collection by attempting a simple operation
            collection.find_one()
            return collection
        except Exception as e:
            print(f"❌ Error accessing collection '{collection_name}': {e}")
            return None
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected with a live ping test"""
        if not self.connected or self.client is None:
            return False
            
        try:
            # Test the connection with a ping (with timeout)
            result = self.client.admin.command('ping', maxTimeMS=5000)  # 5 second timeout
            return result.get('ok') == 1
        except Exception as e:
            print(f"❌ MongoDB connection test failed: {e}")
            self.connected = False
            return False
    
    def reconnect(self):
        """Attempt to reconnect to MongoDB"""
        print("🔄 Attempting to reconnect to MongoDB...")
        self.connected = False
        if self.client:
            try:
                self.client.close()
            except:
                pass
            self.client = None
        
        self._connection_attempts += 1
        if self._connection_attempts <= self._max_attempts:
            self._initialize_connection()
        else:
            print(f"❌ Maximum reconnection attempts ({self._max_attempts}) reached")
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            try:
                self.client.close()
                print("🔌 MongoDB connection closed")
            except Exception as e:
                print(f"⚠️ Warning during MongoDB connection close: {e}")
            finally:
                self.client = None
                self.connected = False
    
    def test_connection(self) -> Dict[str, Any]:
        """Test MongoDB connection and return status"""
        if not self.is_connected():
            return {
                "connected": False,
                "error": "Not connected to MongoDB",
                "collections": []
            }
        
        try:
            # Test database operations
            collections = self.db.list_collection_names()
            server_info = self.client.server_info()
            
            return {
                "connected": True,
                "database": self.db.name,
                "collections": collections,
                "server_version": server_info.get("version", "unknown"),
                "connection_count": len(collections)
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "collections": []
            }

# Global MongoDB manager instance with lazy initialization
_mongodb_manager = None

def get_mongodb():
    """Get MongoDB manager instance (singleton pattern)"""
    global _mongodb_manager
    if _mongodb_manager is None:
        _mongodb_manager = MongoDBManager()
    return _mongodb_manager

def test_mongodb_connection():
    """Test MongoDB connection and print results"""
    print("🧪 Testing MongoDB Connection")
    print("=" * 50)
    
    mongodb = get_mongodb()
    status = mongodb.test_connection()
    
    if status["connected"]:
        print("✅ MongoDB Connection Test Passed")
        print(f"Database: {status['database']}")
        print(f"Server Version: {status['server_version']}")
        print(f"Collections: {status['collections']}")
    else:
        print("❌ MongoDB Connection Test Failed")
        print(f"Error: {status['error']}")
    
    return status["connected"]

# Initialize on import (but don't fail if it doesn't work)
try:
    mongodb_manager = get_mongodb()
    if mongodb_manager.is_connected():
        print("✅ MongoDB manager initialized successfully")
    else:
        print("⚠️ MongoDB manager initialized but not connected")
except Exception as e:
    print(f"⚠️ MongoDB manager initialization error: {e}")
    mongodb_manager = None