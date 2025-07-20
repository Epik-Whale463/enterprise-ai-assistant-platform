"""
MongoDB Manager - Handles MongoDB connections and operations
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
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize MongoDB connection"""
        mongodb_uri = os.getenv("MONGODB_URI")
        database_name = os.getenv("MONGODB_DATABASE", "ai_assistant")
        
        if not mongodb_uri:
            print("❌ MongoDB URI not found in environment variables")
            return
        
        print("🔄 Connecting to MongoDB...")
        
        try:
            # Use the working connection settings that succeeded
            self.client = MongoClient(
                mongodb_uri,
                serverSelectionTimeoutMS=30000,  # 30 seconds
                connectTimeoutMS=60000,          # 60 seconds  
                socketTimeoutMS=60000            # 60 seconds
            )
            
            # Test the connection
            self.client.admin.command('ping')
            
            # Get database
            self.db = self.client[database_name]
            self.connected = True
            
            print(f"✅ Successfully connected to MongoDB database: {database_name}")
            
            # Create indexes for better performance
            self._create_indexes()
            
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            self.connected = False
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            users_collection = self.db.users
            users_collection.create_index("username", unique=True)
            users_collection.create_index("email", unique=True)
            users_collection.create_index("auth_tokens.token")
            
            # Sessions collection indexes
            sessions_collection = self.db.sessions
            sessions_collection.create_index("user_id")
            sessions_collection.create_index("created_at")
            sessions_collection.create_index([("user_id", 1), ("created_at", -1)])
            
            # Messages collection indexes
            messages_collection = self.db.messages
            messages_collection.create_index("session_id")
            messages_collection.create_index("timestamp")
            messages_collection.create_index([("session_id", 1), ("timestamp", 1)])
            
            print("✅ MongoDB indexes created successfully")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create indexes: {e}")
    
    def get_collection(self, collection_name: str):
        """Get a MongoDB collection"""
        if not self.connected or self.db is None:
            return None
        
        return self.db[collection_name]
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        if not self.connected or self.client is None:
            return False
            
        # Test the connection with a ping
        try:
            self.client.admin.command('ping')
            return True
        except Exception:
            self.connected = False
            return False
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            self.connected = False
            print("🔌 MongoDB connection closed")

# Global MongoDB manager instance
mongodb_manager = MongoDBManager()

def get_mongodb():
    """Get MongoDB manager instance"""
    return mongodb_manager