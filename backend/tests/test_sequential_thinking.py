#!/usr/bin/env python3
"""
Test Sequential Thinking functionality
"""

def test_sequential_thinking():
    """Test sequential thinking with MongoDB"""
    print("🧪 Testing Sequential Thinking...")
    
    try:
        # Test MongoDB connection first
        from mongodb_manager import get_mongodb
        mongodb = get_mongodb()
        
        if mongodb.is_connected():
            print("✅ MongoDB connected successfully")
        else:
            print("❌ MongoDB not connected - will use file fallback")
        
        # Test sequential thinking manager
        from sequential_thinking_mongodb import get_sequential_thinking_manager
        manager = get_sequential_thinking_manager()
        
        # Test session
        test_session = "test_session_123"
        
        # Test saving thoughts
        test_thoughts = [
            {
                "step": 0,
                "text": "First thought: Let me analyze this problem",
                "timestamp": 1234567890,
                "uuid": "test-uuid-1",
                "semantic_id": "hash1",
                "confidence": 0.95
            },
            {
                "step": 1,
                "text": "Second thought: I need to consider multiple factors",
                "timestamp": 1234567891,
                "uuid": "test-uuid-2",
                "semantic_id": "hash2",
                "confidence": 0.90
            }
        ]
        
        print(f"💾 Saving {len(test_thoughts)} test thoughts...")
        manager.save_thoughts(test_session, test_thoughts)
        
        # Test loading thoughts
        print("📖 Loading thoughts...")
        loaded_thoughts = manager.load_thoughts(test_session)
        print(f"✅ Loaded {len(loaded_thoughts)} thoughts")
        
        for thought in loaded_thoughts:
            print(f"  Step {thought['step']}: {thought['text'][:50]}...")
        
        # Test session stats
        stats = manager.get_session_stats(test_session)
        print(f"📊 Session stats: {stats}")
        
        # Test the actual sequential_think tool
        print("\n🔧 Testing sequential_think tool...")
        from tools import sequential_think
        
        # Use invoke method instead of direct call to avoid deprecation warning
        result = sequential_think.invoke({
            "thought": "This is a test thought for the tool",
            "session_id": test_session
        })
        
        print(f"🧠 Tool result: {result[:200]}...")
        
        # Clean up
        print("\n🧹 Cleaning up test session...")
        manager.delete_session(test_session)
        
        print("✅ Sequential thinking test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing sequential thinking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_sequential_thinking()