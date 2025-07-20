"""
Sequential Thinking MongoDB Manager - Handles sequential thinking storage in MongoDB
"""
import time
from typing import Dict, List, Any, Optional
from mongodb_manager import get_mongodb

class SequentialThinkingManager:
    """MongoDB-based sequential thinking manager"""
    
    def __init__(self):
        self.mongodb = get_mongodb()
        self.collection_name = "sequential_thinking"
    
    def get_collection(self):
        """Get the sequential thinking collection"""
        if not self.mongodb.is_connected():
            return None
        return self.mongodb.get_collection(self.collection_name)
    
    def load_thoughts(self, session_id: str) -> List[Dict[str, Any]]:
        """Load thoughts for a session from MongoDB"""
        try:
            collection = self.get_collection()
            if not collection:
                return []
            
            # Find the session document
            session_doc = collection.find_one({"session_id": session_id})
            if not session_doc:
                return []
            
            # Return the thoughts, sorted by step
            thoughts = session_doc.get("thoughts", [])
            return sorted(thoughts, key=lambda x: x.get("step", 0))
            
        except Exception as e:
            return []
    
    def save_thoughts(self, session_id: str, thoughts: List[Dict[str, Any]]):
        """Save thoughts for a session to MongoDB"""
        try:
            collection = self.get_collection()
            if not collection:
                # Silently fail if MongoDB not available - fallback will handle it
                return
            
            # Prepare the document
            doc = {
                "session_id": session_id,
                "thoughts": thoughts,
                "updated_at": time.time(),
                "total_thoughts": len(thoughts)
            }
            
            # Upsert the document
            collection.replace_one(
                {"session_id": session_id},
                doc,
                upsert=True
            )
            
        except Exception as e:
            # Silently fail - fallback will handle it
            pass
    
    def get_all_sessions(self) -> List[str]:
        """Get all session IDs that have sequential thinking data"""
        try:
            collection = self.get_collection()
            if collection is None:
                return []
            
            # Get all unique session IDs
            session_ids = collection.distinct("session_id")
            return session_ids
            
        except Exception as e:
            return []
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get statistics for a session"""
        try:
            collection = self.get_collection()
            if collection is None:
                return {"session_id": session_id, "thoughts": 0, "exists": False}
            
            session_doc = collection.find_one({"session_id": session_id})
            if not session_doc:
                return {"session_id": session_id, "thoughts": 0, "exists": False}
            
            thoughts = session_doc.get("thoughts", [])
            return {
                "session_id": session_id,
                "thoughts": len(thoughts),
                "updated_at": session_doc.get("updated_at"),
                "exists": True,
                "latest_thought": thoughts[-1]["text"][:100] + "..." if thoughts else None
            }
            
        except Exception as e:
            print(f"❌ Error getting session stats for {session_id}: {e}")
            return {"session_id": session_id, "error": str(e)}
    
    def delete_session(self, session_id: str) -> bool:
        """Delete all thoughts for a session"""
        try:
            collection = self.get_collection()
            if collection is None:
                return False
            
            result = collection.delete_one({"session_id": session_id})
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"❌ Error deleting session {session_id}: {e}")
            return False

# Global manager instance
_sequential_thinking_manager = None

def get_sequential_thinking_manager() -> SequentialThinkingManager:
    """Get the global sequential thinking manager instance"""
    global _sequential_thinking_manager
    if _sequential_thinking_manager is None:
        _sequential_thinking_manager = SequentialThinkingManager()
    return _sequential_thinking_manager