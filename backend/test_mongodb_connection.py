#!/usr/bin/env python3
"""
Test MongoDB connection with working settings
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection with working settings"""
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if not mongodb_uri:
        print("❌ MONGODB_URI not found in environment variables")
        return False
    
    print(f"🔄 Testing MongoDB connection...")
    print(f"URI: {mongodb_uri[:50]}...")
    
    # Use the working connection settings
    print(f"\n🔄 Testing with working connection settings...")
    
    try:
        client = MongoClient(
            mongodb_uri,
            serverSelectionTimeoutMS=30000,  # 30 seconds
            connectTimeoutMS=60000,          # 60 seconds  
            socketTimeoutMS=60000            # 60 seconds
        )
        
        # Test connection
        result = client.admin.command('ping')
        print(f"✅ Connection successful! Ping result: {result}")
        
        # Test database access
        db = client[os.getenv("MONGODB_DATABASE", "ai_assistant")]
        collections = db.list_collection_names()
        print(f"✅ Database access successful! Collections: {collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    print("\n❌ Connection failed")
    return False

if __name__ == "__main__":
    success = test_mongodb_connection()
    sys.exit(0 if success else 1)