"""
Migration script to transfer data from JSON files to MongoDB
"""
import json
import os
import time
from pathlib import Path
from user_manager_mongodb import MongoUserManager
from chat_session_manager_mongodb import MongoChatSessionManager
from mongodb_manager import get_mongodb

def migrate_users():
    """Migrate users from JSON files to MongoDB"""
    print("🔄 Starting user migration...")
    
    users_dir = Path("users")
    if not users_dir.exists():
        print("📁 No users directory found, skipping user migration")
        return
    
    mongo_user_manager = MongoUserManager()
    migrated_count = 0
    
    # Load sessions.json if it exists
    sessions_file = users_dir / "sessions.json"
    sessions_data = {}
    if sessions_file.exists():
        try:
            with open(sessions_file, 'r', encoding='utf-8') as f:
                sessions_data = json.load(f)
            print(f"📋 Loaded {len(sessions_data)} session tokens")
        except Exception as e:
            print(f"⚠️ Could not load sessions.json: {e}")
    
    # Migrate each user file
    for user_file in users_dir.glob("*.json"):
        if user_file.name == "sessions.json":
            continue
            
        try:
            with open(user_file, 'r', encoding='utf-8') as f:
                user_data = json.load(f)
            
            # Check if user has required fields
            if not all(field in user_data for field in ['id', 'username', 'email', 'password_hash']):
                print(f"⚠️ Skipping invalid user file: {user_file.name}")
                continue
            
            # Check if user already exists in MongoDB
            existing_user = mongo_user_manager.users_collection.find_one({
                "$or": [
                    {"_id": user_data['id']},
                    {"username": {"$regex": f"^{user_data['username']}$", "$options": "i"}}
                ]
            })
            
            if existing_user:
                print(f"👤 User {user_data['username']} already exists in MongoDB, skipping")
                continue
            
            # Create user document for MongoDB
            user_doc = {
                "_id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "password_hash": user_data['password_hash'],
                "created_at": user_data.get('created_at', time.time()),
                "last_login": user_data.get('last_login', time.time()),
                "auth_tokens": []
            }
            
            # Add auth tokens if they exist in sessions_data
            for token, user_id in sessions_data.items():
                if user_id == user_data['id']:
                    user_doc["auth_tokens"].append({
                        "token": token,
                        "created_at": time.time()
                    })
            
            # Insert user into MongoDB
            mongo_user_manager.users_collection.insert_one(user_doc)
            migrated_count += 1
            
            print(f"✅ Migrated user: {user_data['username']} (ID: {user_data['id']})")
            
        except Exception as e:
            print(f"❌ Error migrating user file {user_file.name}: {e}")
    
    print(f"🎉 User migration completed! Migrated {migrated_count} users")

def migrate_chat_sessions():
    """Migrate chat sessions from JSON files to MongoDB"""
    print("🔄 Starting chat session migration...")
    
    chat_history_dir = Path("chat_history")
    if not chat_history_dir.exists():
        print("📁 No chat_history directory found, skipping session migration")
        return
    
    mongo_session_manager = MongoChatSessionManager()
    migrated_sessions = 0
    migrated_messages = 0
    
    # Migrate each session file
    for session_file in chat_history_dir.glob("*.json"):
        if session_file.name.endswith("_messages.jsonl"):
            continue  # Skip message files, we'll handle them separately
            
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            
            session_id = session_data.get('id', session_file.stem)
            
            # Check if session already exists
            existing_session = mongo_session_manager.sessions_collection.find_one({"_id": session_id})
            if existing_session:
                print(f"💬 Session {session_id} already exists in MongoDB, skipping")
                continue
            
            # Create session document for MongoDB
            session_doc = {
                "_id": session_id,
                "title": session_data.get('title', 'Migrated Chat'),
                "preview": session_data.get('preview', ''),
                "created_at": session_data.get('created_at', time.time()),
                "updated_at": session_data.get('updated_at', time.time()),
                "message_count": session_data.get('message_count', 0),
                "model": session_data.get('model', 'unknown'),
                "user_id": session_data.get('user_id')
            }
            
            # Insert session into MongoDB
            mongo_session_manager.sessions_collection.insert_one(session_doc)
            migrated_sessions += 1
            
            # Migrate messages for this session
            messages_file = chat_history_dir / f"{session_id}_messages.jsonl"
            if messages_file.exists():
                try:
                    with open(messages_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            if line.strip():
                                try:
                                    message_data = json.loads(line)
                                    
                                    # Create message document for MongoDB
                                    message_doc = {
                                        "_id": f"{session_id}_{int(message_data.get('timestamp', time.time()) * 1000)}",
                                        "session_id": session_id,
                                        "role": message_data.get('role', 'user'),
                                        "content": message_data.get('content', ''),
                                        "timestamp": message_data.get('timestamp', time.time()),
                                        "model": message_data.get('model', session_doc['model']),
                                        "tools_used": message_data.get('tools_used', [])
                                    }
                                    
                                    # Insert message into MongoDB
                                    mongo_session_manager.messages_collection.insert_one(message_doc)
                                    migrated_messages += 1
                                    
                                except json.JSONDecodeError:
                                    continue
                                    
                except Exception as e:
                    print(f"⚠️ Error migrating messages for session {session_id}: {e}")
            
            print(f"✅ Migrated session: {session_id} ({session_doc['title']})")
            
        except Exception as e:
            print(f"❌ Error migrating session file {session_file.name}: {e}")
    
    print(f"🎉 Chat session migration completed! Migrated {migrated_sessions} sessions and {migrated_messages} messages")

def verify_migration():
    """Verify the migration was successful"""
    print("🔍 Verifying migration...")
    
    mongodb = get_mongodb()
    if not mongodb.is_connected():
        print("❌ Cannot verify migration - MongoDB not connected")
        return
    
    # Get statistics
    users_count = mongodb.db.users.count_documents({})
    sessions_count = mongodb.db.sessions.count_documents({})
    messages_count = mongodb.db.messages.count_documents({})
    
    print(f"📊 Migration verification:")
    print(f"   👤 Users: {users_count}")
    print(f"   💬 Sessions: {sessions_count}")
    print(f"   📝 Messages: {messages_count}")
    
    # Test a few operations
    try:
        # Test user operations
        mongo_user_manager = MongoUserManager()
        user_stats = mongo_user_manager.get_user_stats()
        print(f"   📈 User stats: {user_stats}")
        
        # Test session operations
        mongo_session_manager = MongoChatSessionManager()
        session_stats = mongo_session_manager.get_session_stats()
        print(f"   📈 Session stats: {session_stats}")
        
        print("✅ Migration verification completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")

def main():
    """Main migration function"""
    print("🚀 Starting migration to MongoDB...")
    print("=" * 50)
    
    # Check MongoDB connection
    mongodb = get_mongodb()
    if not mongodb.is_connected():
        print("❌ MongoDB connection failed. Please check your connection string and try again.")
        return
    
    print(f"✅ Connected to MongoDB database: {mongodb.db.name}")
    print("=" * 50)
    
    # Run migrations
    migrate_users()
    print("-" * 30)
    migrate_chat_sessions()
    print("-" * 30)
    verify_migration()
    
    print("=" * 50)
    print("🎉 Migration to MongoDB completed!")
    print("💡 You can now update your application to use the MongoDB managers")

if __name__ == "__main__":
    main()