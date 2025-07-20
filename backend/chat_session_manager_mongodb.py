"""
MongoDB Chat Session Manager - Handles chat history storage and retrieval with MongoDB
"""
import time
import uuid
from typing import Dict, List, Any, Optional
from mongodb_manager import get_mongodb
from pymongo import DESCENDING

class MongoChatSessionManager:
    """
    Manages chat sessions and their persistence to MongoDB
    """
    def __init__(self):
        self.mongodb = get_mongodb()
        self.sessions_collection = self.mongodb.get_collection("sessions")
        self.messages_collection = self.mongodb.get_collection("messages")
        
        if not self.mongodb.is_connected():
            print("❌ MongoDB not connected - Chat Session Manager will not work properly")
        else:
            print("✅ MongoDB Chat Session Manager initialized successfully")
    
    def get_all_sessions(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all chat sessions sorted by last updated time (newest first)"""
        if not self.mongodb.is_connected():
            return []
        
        try:
            # Build query
            query = {}
            if user_id:
                query["user_id"] = user_id
            
            # Get sessions sorted by updated_at (newest first)
            sessions_cursor = self.sessions_collection.find(query).sort("updated_at", DESCENDING)
            
            sessions_list = []
            for session_doc in sessions_cursor:
                # Convert MongoDB document to expected format
                session_data = {
                    "id": session_doc["_id"],
                    "title": session_doc["title"],
                    "preview": session_doc["preview"],
                    "timestamp": session_doc["created_at"],
                    "message_count": session_doc["message_count"],
                    "model": session_doc.get("model", "unknown"),
                    "created_at": session_doc["created_at"],
                    "updated_at": session_doc["updated_at"],
                    "user_id": session_doc.get("user_id")
                }
                sessions_list.append(session_data)
            
            return sessions_list
            
        except Exception as e:
            print(f"❌ Error getting sessions: {e}")
            return []
    
    def get_session(self, session_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a specific session by ID"""
        if not self.mongodb.is_connected():
            return None
        
        try:
            # Build query
            query = {"_id": session_id}
            if user_id:
                query["user_id"] = user_id
            
            session_doc = self.sessions_collection.find_one(query)
            
            if not session_doc:
                return None
            
            # Convert to expected format
            return {
                "id": session_doc["_id"],
                "title": session_doc["title"],
                "preview": session_doc["preview"],
                "timestamp": session_doc["created_at"],
                "message_count": session_doc["message_count"],
                "model": session_doc.get("model", "unknown"),
                "created_at": session_doc["created_at"],
                "updated_at": session_doc["updated_at"],
                "user_id": session_doc.get("user_id")
            }
            
        except Exception as e:
            print(f"❌ Error getting session {session_id}: {e}")
            return None
    
    def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a specific session"""
        if not self.mongodb.is_connected():
            return []
        
        try:
            # Get messages sorted by timestamp (oldest first)
            messages_cursor = self.messages_collection.find(
                {"session_id": session_id}
            ).sort("timestamp", 1)
            
            messages_list = []
            for message_doc in messages_cursor:
                # Convert MongoDB document to expected format
                message_data = {
                    "role": message_doc["role"],
                    "content": message_doc["content"],
                    "timestamp": message_doc["timestamp"],
                    "model": message_doc.get("model"),
                    "tools_used": message_doc.get("tools_used", [])
                }
                messages_list.append(message_data)
            
            return messages_list
            
        except Exception as e:
            print(f"❌ Error getting messages for session {session_id}: {e}")
            return []
    
    def create_session(self, session_id: str, first_message: str, model: str = "ollama-qwen2.5", user_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new chat session"""
        if not self.mongodb.is_connected():
            raise Exception("Database connection not available")
        
        try:
            timestamp = time.time()
            
            # Generate title from first message
            title = self._generate_title(first_message)
            
            # Create session document
            session_doc = {
                "_id": session_id,
                "title": title,
                "preview": first_message[:100] + ('...' if len(first_message) > 100 else ''),
                "created_at": timestamp,
                "updated_at": timestamp,
                "message_count": 1,
                "model": model,
                "user_id": user_id
            }
            
            # Insert session
            self.sessions_collection.insert_one(session_doc)
            
            # Add first message
            self.add_message(session_id, {
                'role': 'user',
                'content': first_message,
                'timestamp': timestamp,
                'model': model
            })
            
            print(f"✅ Created new session: {session_id} for user: {user_id}")
            
            # Return session data in expected format
            return {
                "id": session_id,
                "title": title,
                "preview": session_doc["preview"],
                "timestamp": timestamp,
                "message_count": 1,
                "model": model,
                "created_at": timestamp,
                "updated_at": timestamp,
                "user_id": user_id
            }
            
        except Exception as e:
            print(f"❌ Error creating session {session_id}: {e}")
            raise Exception(f"Failed to create session: {str(e)}")
    
    def add_message(self, session_id: str, message: Dict[str, Any]) -> bool:
        """Add a message to a session"""
        if not self.mongodb.is_connected():
            return False
        
        try:
            # Check if session exists
            session_doc = self.sessions_collection.find_one({"_id": session_id})
            if not session_doc:
                print(f"❌ Session {session_id} not found")
                return False
            
            # Normalize message data
            normalized_message = {
                "_id": str(uuid.uuid4()),
                "session_id": session_id,
                "role": message.get('role', 'user'),
                "content": message.get('content', ''),
                "timestamp": message.get('timestamp', time.time()),
                "model": message.get('model', session_doc.get('model', 'unknown')),
                "tools_used": message.get('tools_used', [])
            }
            
            # Insert message
            self.messages_collection.insert_one(normalized_message)
            
            # Update session metadata
            update_data = {
                "message_count": session_doc["message_count"] + 1,
                "updated_at": normalized_message["timestamp"]
            }
            
            # Update preview if it's a user message
            if normalized_message['role'] == 'user':
                content = normalized_message['content']
                update_data['preview'] = content[:100] + ('...' if len(content) > 100 else '')
            
            self.sessions_collection.update_one(
                {"_id": session_id},
                {"$set": update_data}
            )
            
            return True
            
        except Exception as e:
            print(f"❌ Error adding message to session {session_id}: {e}")
            return False
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a chat session and all its messages"""
        if not self.mongodb.is_connected():
            return False
        
        try:
            # Delete all messages for this session
            messages_result = self.messages_collection.delete_many({"session_id": session_id})
            
            # Delete the session
            session_result = self.sessions_collection.delete_one({"_id": session_id})
            
            if session_result.deleted_count > 0:
                print(f"✅ Deleted session {session_id} and {messages_result.deleted_count} messages")
                return True
            else:
                print(f"❌ Session {session_id} not found")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting session {session_id}: {e}")
            return False
    
    def _generate_title(self, message: str) -> str:
        """Generate a title from the first message"""
        if not message:
            return "New Chat"
        
        # Clean and truncate
        title = message.strip()
        if len(title) > 50:
            title = title[:47] + "..."
        
        # Remove common prefixes
        prefixes = ["how can i", "can you", "please", "i need", "help me", "what is", "explain"]
        title_lower = title.lower()
        for prefix in prefixes:
            if title_lower.startswith(prefix):
                title = title[len(prefix):].strip()
                break
        
        # Capitalize first letter
        if title:
            title = title[0].upper() + title[1:]
        
        return title or "New Chat"
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics"""
        if not self.mongodb.is_connected():
            return {"error": "Database not connected"}
        
        try:
            total_sessions = self.sessions_collection.count_documents({})
            total_messages = self.messages_collection.count_documents({})
            
            # Get sessions by model
            pipeline = [
                {"$group": {"_id": "$model", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            model_stats = list(self.sessions_collection.aggregate(pipeline))
            
            return {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "sessions_by_model": model_stats
            }
            
        except Exception as e:
            print(f"❌ Error getting session stats: {e}")
            return {"error": str(e)}