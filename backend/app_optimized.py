# app_optimized.py - High-performance Flask application
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import uuid
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading
import sys

# Check if optimized AI core exists, fallback to regular if not
try:
    from ai_core_optimized import run_agent_optimized, run_agent_async
    print("✅ Using optimized AI core")
except ImportError:
    print("⚠️  Optimized AI core not found, falling back to regular AI core")
    from ai_core import run_agent
    run_agent_optimized = run_agent
    
    # Create a simple async wrapper
    async def run_agent_async(user_input: str, thread_id: str = "default"):
        return run_agent(user_input, thread_id)

# Import MongoDB-based managers (required)
try:
    from chat_session_manager_mongodb import MongoChatSessionManager
    from user_manager_mongodb import MongoUserManager
    MONGODB_AVAILABLE = True
    print("✅ Using MongoDB for data storage")
except ImportError as e:
    print(f"⚠️ MongoDB managers not available: {e}")
    # Fallback to file-based managers
    from chat_session_manager import ChatSessionManager
    from user_manager import UserManager
    MONGODB_AVAILABLE = False
    print("✅ Using file-based storage")

# ------------------------------------------------------------------
# 1. OPTIMIZED FLASK APP SETUP
# ------------------------------------------------------------------

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://localhost:5173"],  # Specific origins
     methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"],  # All needed methods
     allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],  # All needed headers
     supports_credentials=True,  # Allow credentials for session handling
     expose_headers=["Set-Cookie", "Authorization"]  # Expose headers
)

# Optimized session configuration
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-secret-key-for-testing'),  # Use consistent key for testing
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    SESSION_COOKIE_SAMESITE=None,  # Allow cross-site cookies
    PERMANENT_SESSION_LIFETIME=3600,  # 1 hour
)

# Make sessions permanent by default
@app.before_request
def make_session_permanent():
    session.permanent = True

# ------------------------------------------------------------------
# 2. REQUEST RATE LIMITING & MONITORING
# ------------------------------------------------------------------

class RequestMonitor:
    def __init__(self):
        self.request_counts = {}
        self.request_times = {}
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def track_request(self, session_id: str):
        """Track request for monitoring and rate limiting"""
        current_time = time.time()
        
        if session_id not in self.request_counts:
            self.request_counts[session_id] = []
        
        self.request_counts[session_id].append(current_time)
        
        # Cleanup old requests
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_requests()
    
    def _cleanup_old_requests(self):
        """Remove old request tracking data"""
        cutoff_time = time.time() - 3600  # 1 hour ago
        
        for session_id in list(self.request_counts.keys()):
            self.request_counts[session_id] = [
                req_time for req_time in self.request_counts[session_id]
                if req_time > cutoff_time
            ]
            
            if not self.request_counts[session_id]:
                del self.request_counts[session_id]
        
        self.last_cleanup = time.time()
    
    def is_rate_limited(self, session_id: str, max_requests=30, window=300) -> bool:
        """Check if session is rate limited (30 requests per 5 minutes)"""
        if session_id not in self.request_counts:
            return False
        
        cutoff_time = time.time() - window
        recent_requests = [
            req_time for req_time in self.request_counts[session_id]
            if req_time > cutoff_time
        ]
        
        return len(recent_requests) >= max_requests

monitor = RequestMonitor()

# Initialize chat session manager and user manager with fallback
try:
    if MONGODB_AVAILABLE:
        chat_manager = MongoChatSessionManager()
        user_manager = MongoUserManager()
        
        # Check if MongoDB is actually working
        from mongodb_manager import get_mongodb
        mongodb = get_mongodb()
        if not mongodb.is_connected():
            print("⚠️ MongoDB connection failed, falling back to file-based storage")
            raise ConnectionError("MongoDB not connected")
    else:
        raise ImportError("MongoDB managers not available")
        
except (ImportError, ConnectionError, Exception) as e:
    print(f"⚠️ Falling back to file-based managers: {e}")
    try:
        from chat_session_manager import ChatSessionManager
        from user_manager import UserManager
        chat_manager = ChatSessionManager()
        user_manager = UserManager()
        print("✅ File-based managers initialized successfully")
    except ImportError:
        print("❌ No fallback managers available - creating minimal implementations")
        
        # Create minimal fallback implementations
        class MinimalChatManager:
            def get_all_sessions(self, user_id=None): return []
            def create_session(self, *args, **kwargs): return {"id": "temp", "title": "Temporary Session"}
            def get_session_messages(self, *args, **kwargs): return []
            def add_message(self, *args, **kwargs): pass
            def delete_session(self, *args, **kwargs): pass
            
        class MinimalUserManager:
            def authenticate_user(self, *args, **kwargs): return {"success": False, "message": "Authentication disabled"}
            def register_user(self, *args, **kwargs): return {"success": False, "message": "Registration disabled"}
            def get_user_by_token(self, *args, **kwargs): return None
            
        chat_manager = MinimalChatManager()
        user_manager = MinimalUserManager()
        print("⚠️ Using minimal fallback managers - limited functionality")


# ------------------------------------------------------------------
# 3. THREAD POOL FOR CONCURRENT PROCESSING
# ------------------------------------------------------------------

executor = ThreadPoolExecutor(max_workers=5, thread_name_prefix="ai-worker")

# ------------------------------------------------------------------
# 4. OPTIMIZED ENDPOINTS
# ------------------------------------------------------------------

@app.route('/health', methods=['GET'])
def health():
    """Ultra-fast health check"""
    return {'status': 'healthy', 'timestamp': int(time.time())}, 200

@app.route('/chat', methods=['POST'])
def chat():
    """Optimized chat endpoint with async processing and model selection"""
    start_time = time.time()
    
    try:
        # Get request data first
        data = request.get_json(silent=True) or {}
        
        # Get current user ID from session
        auth_token = session.get('auth_token')
        if not auth_token:
            print("❌ No auth token provided in chat request")
            print(f"Headers: {request.headers}")
            print(f"Body keys: {list(data.keys())}")
            print(f"Session keys: {list(session.keys())}")
            return {'error': 'Authentication required'}, 401
            
        print(f"🔑 Using auth token for chat: {auth_token[:8]}...")
        
        # Get user from token
        user_data = user_manager.get_user_by_token(auth_token)
        if not user_data:
            print(f"❌ Invalid auth token: {auth_token[:8]}...")
            return {'error': 'Invalid authentication'}, 401
            
        user_id = user_data['id']
        print(f"✅ Using auth token for chat")
        
        # Fast input validation
        if not data:
            return {'error': 'Invalid JSON'}, 400
        
        user_input = data.get('message', '').strip()
        selected_model = data.get('model', 'ollama-qwen2.5')
        
        # Debug logging
        print(f"🔍 DEBUG - Received request from user {user_id}:")
        print(f"Message: {user_input}")
        print(f"Model: {selected_model}")
        
        if not user_input:
            return {'error': 'Empty message'}, 400
        
        if len(user_input) > 5000:  # Reasonable limit
            return {'error': 'Message too long'}, 400
        
        # Session management - use user ID as part of the session ID
        chat_session_id = f"{user_id}_{str(uuid.uuid4())}"
        print(f"✅ Created new chat session ID: {chat_session_id}")
        
        # Rate limiting
        if monitor.is_rate_limited(chat_session_id):
            return {'error': 'Rate limit exceeded. Please wait before sending more messages.'}, 429
        
        monitor.track_request(chat_session_id)
        
        # Process request
        forced_tool = data.get('forced_tool')
        if forced_tool:
            print(f"🔧 FORCED TOOL: {forced_tool} | Session: {chat_session_id}")
        
        # Submit to thread pool for processing with model selection
        future = executor.submit(run_agent_optimized, user_input, chat_session_id, selected_model)
        
        # Wait for result with timeout
        try:
            result = future.result(timeout=120)  # 2 minute timeout
        except TimeoutError:
            return {'error': 'Request timeout. Please try a simpler query.'}, 408
        
        # Prepare response
        response_data = {
            'response': result['response'],
            'tools_used': result.get('tools_used', []),
            'session_id': chat_session_id,
            'execution_time': result.get('execution_time', 0),
            'total_time': time.time() - start_time
        }
        
        # Include Spotify track ID if available
        if 'spotify_track_id' in result:
            response_data['spotify_track_id'] = result['spotify_track_id']
            print(f"🎵 APP: Including Spotify track ID in response: {result['spotify_track_id']}")
        
        if forced_tool:
            response_data['forced_tool'] = forced_tool
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return {'error': f'Server error: {str(e)}'}, 500

# ------------------------------------------------------------------
# 5. ASYNC CHAT ENDPOINT (EXPERIMENTAL)
# ------------------------------------------------------------------

@app.route('/chat-async', methods=['POST'])
def chat_async():
    """Experimental async chat endpoint"""
    async def process_async():
        data = request.get_json()
        user_input = data.get('message', '').strip()
        session_id = session.get('session_id', str(uuid.uuid4()))
        
        result = await run_agent_async(user_input, session_id)
        return result
    
    # Run async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(process_async())
        return jsonify(result)
    finally:
        loop.close()

# ------------------------------------------------------------------
# 5.4. USER AUTHENTICATION ENDPOINTS
# ------------------------------------------------------------------

@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return {'error': 'Invalid JSON'}, 400
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        if not all(field in data for field in required_fields):
            return {'error': 'Missing required fields'}, 400
        
        # Register user
        try:
            user_data = user_manager.register_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            
            # Set auth token in session
            session['auth_token'] = user_data['auth_token']
            
            return jsonify({
                'message': 'User registered successfully',
                'user': user_data
            })
        except ValueError as e:
            return {'error': str(e)}, 400
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return {'error': f'Server error: {str(e)}'}, 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return {'error': 'Invalid JSON'}, 400
        
        # Validate required fields
        if not all(field in data for field in ['username', 'password']):
            return {'error': 'Missing username or password'}, 400
        
        # Login user
        try:
            user_data = user_manager.login_user(
                username=data['username'],
                password=data['password']
            )
            
            # Set auth token in session
            session['auth_token'] = user_data['auth_token']
            
            # Debug log
            print(f"✅ User logged in: {user_data['username']} (ID: {user_data['id']})")
            print(f"✅ Auth token set in session: {user_data['auth_token'][:8]}...")
            print(f"✅ Session object: {session}")
            
            # Create response
            response = jsonify({
                'message': 'Login successful',
                'user': user_data
            })
            
            # Set auth token in a cookie as well (for redundancy)
            response.set_cookie(
                'auth_token',
                user_data['auth_token'],
                httponly=True,
                samesite=None,
                secure=False,  # Set to True in production with HTTPS
                max_age=3600  # 1 hour
            )
            
            return response
        except ValueError as e:
            return {'error': str(e)}, 401
    except Exception as e:
        print(f"❌ Login error: {e}")
        return {'error': f'Server error: {str(e)}'}, 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    """Logout a user"""
    try:
        auth_token = session.get('auth_token')
        if auth_token:
            user_manager.logout_user(auth_token)
            session.pop('auth_token', None)
        
        return jsonify({'message': 'Logout successful'})
    except Exception as e:
        print(f"❌ Logout error: {e}")
        return {'error': f'Server error: {str(e)}'}, 500

@app.route('/auth/user', methods=['GET'])
def get_current_user():
    """Get the current authenticated user"""
    try:
        auth_token = session.get('auth_token')
        if not auth_token:
            return {'error': 'Not authenticated'}, 401
        
        user_data = user_manager.get_user_by_token(auth_token)
        if not user_data:
            return {'error': 'Invalid or expired session'}, 401
        
        return jsonify({'user': user_data})
    except Exception as e:
        print(f"❌ Get user error: {e}")
        return {'error': f'Server error: {str(e)}'}, 500

# Helper function to get the current user
def get_current_user_id():
    """Get the current user ID from the session or request"""
    # First try to get from session
    auth_token = session.get('auth_token')
    print(f"Session auth_token: {auth_token[:8] if auth_token and len(auth_token) > 8 else auth_token}")
    
    # If not in session, try to get from cookies
    if not auth_token:
        auth_token = request.cookies.get('auth_token')
        if auth_token:
            print(f"Cookie auth_token: {auth_token[:8]}...")
    
    # If not in cookies, try to get from request headers
    if not auth_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            auth_token = auth_header[7:]  # Remove 'Bearer ' prefix
            print(f"Header auth_token: {auth_token[:8]}...")
    
    # If still not found, try to get from request body
    if not auth_token:
        try:
            data = request.get_json(silent=True) or {}
            auth_token = data.get('auth_token')
            if auth_token:
                print(f"Body auth_token: {auth_token[:8]}...")
        except:
            pass
    
    if not auth_token:
        print("❌ No auth_token found in session, cookies, headers, or request body")
        print(f"Session: {session}")
        print(f"Cookies: {request.cookies}")
        print(f"Headers: {request.headers}")
        return None
    
    # For testing purposes
    if auth_token.startswith('test-'):
        print(f"✅ Using test auth token")
        return "test-user-id-123"
    
    print(f"🔍 Looking up user by auth_token: {auth_token[:8] if len(auth_token) > 8 else auth_token}...")
    user_data = user_manager.get_user_by_token(auth_token)
    if not user_data:
        print(f"❌ No user found for auth_token: {auth_token[:8] if len(auth_token) > 8 else auth_token}...")
        return None
    
    print(f"✅ Found user: {user_data['username']} (ID: {user_data['id']})")
    return user_data['id']

# ------------------------------------------------------------------
# 5.5. SESSION MANAGEMENT ENDPOINTS
# ------------------------------------------------------------------

@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all chat sessions for the current user"""
    try:
        print("📋 GET /sessions - Request received")
        
        # Get current user ID
        user_id = get_current_user_id()
        if not user_id:
            return {'error': 'Authentication required'}, 401
        
        # Get sessions for this user only
        sessions = chat_manager.get_all_sessions(user_id)
        print(f"📋 GET /sessions - Found {len(sessions)} sessions for user {user_id}")
        
        response = {
            'sessions': sessions,
            'total': len(sessions)
        }
        return jsonify(response)
    except Exception as e:
        print(f"❌ Error getting sessions: {e}")
        import traceback
        traceback.print_exc()
        return {'error': f'Failed to get sessions: {str(e)}'}, 500

@app.route('/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get a specific session with its messages"""
    try:
        print(f"📋 GET /sessions/{session_id} - Request received")
        print(f"Headers: {request.headers}")
        print(f"Cookies: {request.cookies}")
        print(f"Session: {session}")
        
        # Get auth token from multiple sources
        auth_token = None
        
        # 1. Try Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            auth_token = auth_header[7:]  # Remove 'Bearer ' prefix
            print(f"Found auth token in header: {auth_token[:8]}...")
        
        # 2. Try cookies
        if not auth_token:
            auth_token = request.cookies.get('auth_token')
            if auth_token:
                print(f"Found auth token in cookie: {auth_token[:8]}...")
        
        # 3. Try session
        if not auth_token:
            auth_token = session.get('auth_token')
            if auth_token:
                print(f"Found auth token in session: {auth_token[:8]}...")
        
        # 4. Try query parameters
        if not auth_token:
            auth_token = request.args.get('auth_token')
            if auth_token:
                print(f"Found auth token in query param: {auth_token[:8]}...")
        
        # If we have an auth token, store it in session for future requests
        if auth_token:
            session['auth_token'] = auth_token
            print(f"✅ Auth token stored in session: {auth_token[:8]}...")
        
        # Get current user ID
        user_id = None
        if auth_token:
            # For testing purposes
            if auth_token.startswith('test-'):
                print(f"✅ Using test auth token")
                user_id = "test-user-id-123"
            else:
                user_data = user_manager.get_user_by_token(auth_token)
                if user_data:
                    user_id = user_data['id']
                    print(f"✅ Found user: {user_data['username']} (ID: {user_id})")
        
        if not user_id:
            print("❌ No valid user ID found")
            return {'error': 'Authentication required'}, 401
        
        # Get session data, ensuring it belongs to the current user
        session_data = chat_manager.get_session(session_id, user_id)
        if not session_data:
            print(f"❌ Session {session_id} not found or doesn't belong to user {user_id}")
            return {'error': 'Session not found'}, 404
        
        messages = chat_manager.get_session_messages(session_id)
        print(f"📋 GET /sessions/{session_id} - Found {len(messages)} messages")
        
        response = {
            'session': session_data,
            'messages': messages
        }
        return jsonify(response)
    except Exception as e:
        print(f"❌ Error getting session {session_id}: {e}")
        import traceback
        traceback.print_exc()
        return {'error': f'Failed to get session: {str(e)}'}, 500

@app.route('/sessions', methods=['POST'])
def create_session():
    """Create a new chat session"""
    try:
        # Get current user ID
        user_id = get_current_user_id()
        if not user_id:
            return {'error': 'Authentication required'}, 401
            
        data = request.get_json(silent=True)
        if not data:
            return {'error': 'Invalid JSON'}, 400
            
        message = data.get('message', '').strip()
        model = data.get('model', 'ollama-qwen2.5')
        
        if not message:
            return {'error': 'Message is required'}, 400
        
        # Generate new session ID
        session_id = str(uuid.uuid4())
        
        # Create session with user ID
        session_data = chat_manager.create_session(session_id, message, model, user_id)
        
        return jsonify(session_data)
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return {'error': f'Failed to create session: {str(e)}'}, 500

@app.route('/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a chat session"""
    try:
        # Get current user ID
        user_id = get_current_user_id()
        if not user_id:
            return {'error': 'Authentication required'}, 401
            
        # Check if session belongs to user
        session_data = chat_manager.get_session(session_id, user_id)
        if not session_data:
            return {'error': 'Session not found or access denied'}, 404
            
        success = chat_manager.delete_session(session_id)
        if success:
            return jsonify({'success': True})
        else:
            return {'error': 'Session not found'}, 404
    except Exception as e:
        print(f"❌ Error deleting session {session_id}: {e}")
        return {'error': f'Failed to delete session: {str(e)}'}, 500

@app.route('/sessions/<session_id>/messages', methods=['POST'])
def add_message_to_session(session_id):
    """Add a message to an existing session"""
    try:
        # Get auth token from session
        auth_token = session.get('auth_token')
        
        # If not in session, try to get from request
        if not auth_token:
            data = request.get_json(silent=True) or {}
            auth_token = data.get('auth_token')
            
        print(f"🔑 Using auth token for message: {auth_token[:8] if auth_token and len(auth_token) > 8 else auth_token}...")
        
        if auth_token:
            session['auth_token'] = auth_token
            print(f"✅ Auth token stored in session: {auth_token[:8] if len(auth_token) > 8 else auth_token}...")
        
        # Get user from token
        user_data = None
        if auth_token:
            user_data = user_manager.get_user_by_token(auth_token)
            
        if not user_data:
            # For testing purposes
            if auth_token and auth_token.startswith('test-'):
                print(f"✅ Using test auth token")
                user_id = "test-user-id-123"
            else:
                print(f"❌ Invalid auth token for session {session_id}")
                return {'error': 'Authentication required'}, 401
        else:
            user_id = user_data['id']
            
        # Check if session belongs to user
        session_data = chat_manager.get_session(session_id, user_id)
        if not session_data:
            print(f"❌ Session {session_id} not found or doesn't belong to user {user_id}")
            return {'error': 'Session not found or access denied'}, 404
            
        data = request.get_json(silent=True) or {}
        
        message = {
            'role': data.get('role', 'user'),
            'content': data.get('content', ''),
            'timestamp': data.get('timestamp', time.time()),
            'model': data.get('model'),
            'tools_used': data.get('tools_used', [])
        }
        
        # Debug log
        print(f"✅ Adding message to session {session_id} for user {user_id}")
        print(f"Role: {message['role']}, Content: {message['content'][:50]}...")
        
        success = chat_manager.add_message(session_id, message)
        if success:
            return jsonify({'success': True})
        else:
            return {'error': 'Session not found'}, 404
    except Exception as e:
        print(f"❌ Error adding message to session {session_id}: {e}")
        return {'error': f'Failed to add message: {str(e)}'}, 500

# ------------------------------------------------------------------
# 6. PERFORMANCE MONITORING AND MODEL ENDPOINTS
# ------------------------------------------------------------------

@app.route('/stats', methods=['GET'])
def stats():
    """Performance statistics endpoint"""
    return jsonify({
        'active_sessions': len(monitor.request_counts),
        'total_requests': sum(len(reqs) for reqs in monitor.request_counts.values()),
        'server_uptime': time.time() - app.start_time if hasattr(app, 'start_time') else 0,
        'thread_pool_active': executor._threads and len([t for t in executor._threads if t.is_alive()]),
    })

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models endpoint"""
    try:
        # Import here to avoid circular imports
        from ai_core_optimized import llm_manager
        
        # Get local models
        local_models = []
        for model_key in llm_manager._ollama_pools.keys():
            model_config = llm_manager._ollama_pools[model_key]["config"]
            local_models.append({
                "id": f"ollama-{model_key}",
                "name": model_key.capitalize(),
                "description": f"Local {model_key.capitalize()} model running on Ollama",
                "strengths": model_config.get("strengths", []),
                "category": "Local"
            })
        
        # Get Sarvam models
        sarvam_models = [
            {
                "id": "sarvam-m",
                "name": "Sarvam-M",
                "description": "Sarvam.ai's multilingual model",
                "strengths": ["multilingual", "conversation"],
                "category": "API"
            }
        ]
        
        # Get GitHub AI models if available
        github_models = []
        try:
            from ai_core_github_integration import get_github_ai_models
            github_models = get_github_ai_models()
        except ImportError:
            pass
        
        # Combine all models
        all_models = local_models + sarvam_models + github_models
        
        return jsonify({
            "models": all_models
        })
    except Exception as e:
        print(f"❌ Error getting models: {e}")
        return {'error': f'Failed to get models: {str(e)}'}, 500

# ------------------------------------------------------------------
# 7. ERROR HANDLERS
# ------------------------------------------------------------------

@app.errorhandler(404)
def not_found(error):
    return {'error': 'Endpoint not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500

@app.errorhandler(413)
def request_too_large(error):
    return {'error': 'Request too large'}, 413

# ------------------------------------------------------------------
# 8. STARTUP OPTIMIZATION
# ------------------------------------------------------------------

def startup():
    """Initialize components on startup"""
    app.start_time = time.time()
    print("🚀 Optimized AI Assistant starting up...")
    print(f"� Thiread pool initialized with {executor._max_workers} workers")

# Initialize on import
startup()

# ------------------------------------------------------------------
# 9. GRACEFUL SHUTDOWN
# ------------------------------------------------------------------

import atexit

def cleanup():
    """Cleanup resources on shutdown"""
    print("🛑 Shutting down gracefully...")
    executor.shutdown(wait=True)

atexit.register(cleanup)

# ------------------------------------------------------------------
# 10. MAIN ENTRY POINT
# ------------------------------------------------------------------

if __name__ == '__main__':
    print("🚀 Starting Optimized AI Assistant...")
    print("⚡ Performance features enabled:")
    print("  - Connection pooling")
    print("  - Response caching") 
    print("  - Smart tool selection")
    print("  - Request rate limiting")
    print("  - Concurrent processing")
    
    app.run(
        debug=False,  # Disable debug for performance
        host='0.0.0.0',
        port=5000,
        threaded=True,  # Enable threading
        use_reloader=False  # Disable reloader for performance
    )