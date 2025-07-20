#!/usr/bin/env python3
"""
Test MongoDB Sequential Thinking directly
"""

def test_mongodb_sequential():
    """Test MongoDB sequential thinking directly"""
    print("🧪 Testing MongoDB Sequential Thinking directly...")
    
    try:
        from sequential_thinking_mongodb import get_sequential_thinking_manager
        
        manager = get_sequential_thinking_manager()
        test_session = "test_mongodb_session_123"
        
        # Test saving thoughts directly
        test_thoughts = [
            {
                "step": 0,
                "text": "First thought: Testing MongoDB storage",
                "timestamp": 1234567890,
                "uuid": "test-uuid-1",
                "semantic_id": "hash1",
                "confidence": 0.95
            },
            {
                "step": 1,
                "text": "Second thought: Verifying data persistence",
                "timestamp": 1234567891,
                "uuid": "test-uuid-2",
                "semantic_id": "hash2",
                "confidence": 0.90
            }
        ]
        
        print(f"💾 Saving {len(test_thoughts)} thoughts to MongoDB...")
        manager.save_thoughts(test_session, test_thoughts)
        
        # Test loading thoughts
        print("📖 Loading thoughts from MongoDB...")
        loaded_thoughts = manager.load_thoughts(test_session)
        print(f"✅ Loaded {len(loaded_thoughts)} thoughts from MongoDB")
        
        if loaded_thoughts:
            for thought in loaded_thoughts:
                print(f"  Step {thought['step']}: {thought['text'][:50]}...")
        else:
            print("❌ No thoughts loaded from MongoDB")
        
        # Test using the actual tool with proper session ID
        print("\n🔧 Testing sequential_think tool with proper session ID...")
        from tools import sequential_think
        
        result = sequential_think.invoke({
            "thought": "Testing with proper session ID",
            "session_id": test_session,
            "branch_from": "None",
            "operation": "append"
        })
        
        print(f"🧠 Tool result: {result[:200]}...")
        
        # Check if it was saved to MongoDB
        print("\n📖 Checking if tool result was saved to MongoDB...")
        loaded_after_tool = manager.load_thoughts(test_session)
        print(f"✅ Found {len(loaded_after_tool)} thoughts in MongoDB after tool use")
        
        # Clean up
        print("\n🧹 Cleaning up...")
        manager.delete_session(test_session)
        
        print("✅ MongoDB sequential thinking test completed!")
        
    except Exception as e:
        print(f"❌ Error testing MongoDB sequential thinking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mongodb_sequential()