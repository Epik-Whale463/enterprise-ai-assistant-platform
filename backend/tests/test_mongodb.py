"""
Test MongoDB connection and basic operations
"""
from mongodb_manager import get_mongodb
from user_manager_mongodb import MongoUserManager
from chat_session_manager_mongodb import MongoChatSessionManager

def test_connection():
    """Test MongoDB connection"""
    print("🔄 Testing MongoDB connection...")
    
    mongodb = get_mongodb()
    if mongodb.is_connected():
        print("✅ MongoDB connection successful!")
        print(f"📊 Database: {mongodb.db.name}")
        
        # List collections
        collections = mongodb.db.list_collection_names()
        print(f"📁 Collections: {collections}")
        
        return True
    else:
        print("❌ MongoDB connection failed!")
        return False

def test_user_operations():
    """Test user operations"""
    print("\n🔄 Testing user operations...")
    
    user_manager = MongoUserManager()
    
    # Get user stats
    stats = user_manager.get_user_stats()
    print(f"📊 User stats: {stats}")
    
    # Test user registration (optional - comment out if you don't want to create test users)
    # try:
    #     test_user = user_manager.register_user("testuser", "test@example.com", "testpassword")
    #     print(f"✅ Test user created: {test_user['username']}")
    #     
    #     # Test login
    #     login_result = user_manager.login_user("testuser", "testpassword")
    #     print(f"✅ Test user login successful: {login_result['username']}")
    #     
    # except Exception as e:
    #     print(f"⚠️ Test user operations: {e}")

def test_session_operations():
    """Test session operations"""
    print("\n🔄 Testing session operations...")
    
    session_manager = MongoChatSessionManager()
    
    # Get session stats
    stats = session_manager.get_session_stats()
    print(f"📊 Session stats: {stats}")
    
    # Get all sessions
    sessions = session_manager.get_all_sessions()
    print(f"💬 Total sessions found: {len(sessions)}")
    
    if sessions:
        # Test getting messages for first session
        first_session = sessions[0]
        messages = session_manager.get_session_messages(first_session['id'])
        print(f"📝 Messages in first session: {len(messages)}")

def test_sequential_thinking_operations():
    """Test sequential thinking operations"""
    print("\n🔄 Testing sequential thinking operations...")
    
    try:
        from sequential_thinking_mongodb import get_sequential_thinking_manager
        thinking_manager = get_sequential_thinking_manager()
        
        # Get all sessions
        sessions = thinking_manager.get_all_sessions()
        print(f"🧠 Total thinking sessions found: {len(sessions)}")
        
        if sessions:
            # Test getting thoughts for first session
            first_session = sessions[0]
            thoughts = thinking_manager.load_thoughts(first_session)
            stats = thinking_manager.get_session_stats(first_session)
            print(f"💭 Thoughts in first session: {len(thoughts)}")
            print(f"📊 Session stats: {stats}")
        
    except ImportError:
        print("⚠️ Sequential thinking manager not available")

def main():
    """Main test function"""
    print("🧪 MongoDB Test Suite")
    print("=" * 40)
    
    if not test_connection():
        return
    
    test_user_operations()
    test_session_operations()
    
    print("\n" + "=" * 40)
    print("🎉 MongoDB tests completed!")

if __name__ == "__main__":
    main()