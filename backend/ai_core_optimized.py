# ai_core_optimized.py - High-performance AI core with enhanced reasoning
from __future__ import annotations
import os
import asyncio
import time
import re
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from functools import lru_cache
from collections import defaultdict
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import json

# Import GitHub AI integration
try:
    from ai_core_github_integration import (
        execute_github_ai_model,
        is_github_ai_model,
        get_github_ai_models
    )
    GITHUB_AI_AVAILABLE = True
    print("✅ GitHub AI integration loaded")
except ImportError:
    GITHUB_AI_AVAILABLE = False
    print("⚠️ GitHub AI integration not available")

load_dotenv()
os.environ.setdefault("LANGCHAIN_TRACING_V2", "false")

# ------------------------------------------------------------------
# PERFORMANCE CONFIGURATION
# ------------------------------------------------------------------

@dataclass
class PerformanceConfig:
    """Centralized performance configuration"""
    pool_size: int = 4
    max_context: int = 8192
    max_predict: int = 1024
    num_threads: int = 8
    cache_ttl: int = 300
    max_cache_size: int = 1000
    memory_cleanup_interval: int = 3600
    response_timeout: int = 30

config = PerformanceConfig()

# ------------------------------------------------------------------
# ENHANCED MULTI-MODEL LLM MANAGER
# ------------------------------------------------------------------

class EnhancedMultiModelLLM:
    """Thread-safe LLM manager with intelligent model selection"""
    
    def __init__(self):
        self._ollama_pools = {}
        self._sarvam_client = None
        self._model_metrics = defaultdict(lambda: {"requests": 0, "avg_response_time": 0})
        self._lock = threading.RLock()
        self._initialize()
    
    def _initialize(self):
        """Initialize LLM pools and clients"""
        try:
            self._initialize_ollama_pools()
            self._initialize_sarvam()
        except Exception as e:
            print(f"Warning: LLM initialization error: {e}")
    
    def _initialize_ollama_pools(self):
        """Initialize optimized Ollama model pools"""
        ollama_models = {
            "qwen2.5": {
                "model": "qwen2.5:7b-instruct-q5_K_M",
                "temperature": 0.2,
                "strengths": ["reasoning", "coding", "analysis"],
                "system_prompt": "You are a helpful AI assistant. Think step-by-step and use tools efficiently."
            },
            "llama3.1": {
                "model": "llama3.1:latest", 
                "temperature": 0.3,
                "strengths": ["creative", "conversation", "general"],
                "system_prompt": "You are a helpful AI assistant. Be creative and engaging while staying focused."
            }
        }
        
        for model_key, model_config in ollama_models.items():
            pool = []
            for _ in range(config.pool_size):
                llm = ChatOllama(
                    model=model_config["model"],
                    temperature=model_config["temperature"],
                    num_ctx=config.max_context,
                    num_predict=config.max_predict,
                    repeat_penalty=1.1,
                    top_k=40,
                    top_p=0.9,
                    num_thread=config.num_threads,
                    timeout=config.response_timeout,
                    # Add system message configuration
                    system=model_config.get("system_prompt", "You are a helpful AI assistant.")
                )
                pool.append(llm)
            
            self._ollama_pools[model_key] = {
                "pool": pool,
                "index": 0,
                "config": model_config
            }
    
    def _initialize_sarvam(self):
        """Initialize Sarvam.ai client with error handling"""
        try:
            import sarvamai
            api_key = os.getenv("SARVAM_API_KEY")
            if api_key:
                self._sarvam_client = sarvamai.SarvamAI(api_subscription_key=api_key)
                print("Sarvam.ai client initialized")
        except ImportError:
            print("Sarvam.ai package not available")
    
    def get_optimal_model(self, user_input: str, model_preference: str = None) -> str:
        """Intelligent model selection based on input analysis"""
        if model_preference and model_preference.startswith("sarvam-"):
            return model_preference
        
        input_lower = user_input.lower()
        
        # Analyze input for model selection
        if any(keyword in input_lower for keyword in 
               ["code", "program", "debug", "algorithm", "technical", "analyze"]):
            return "ollama-qwen2.5"  # Better for technical tasks
        elif any(keyword in input_lower for keyword in 
                 ["story", "creative", "imagine", "poem", "chat"]):
            return "ollama-llama3.1"  # Better for creative tasks
        
        # Default based on performance metrics
        best_model = min(self._model_metrics.items(), 
                        key=lambda x: x[1]["avg_response_time"])
        return best_model[0] if best_model else "ollama-qwen2.5"
    
    def get_llm(self, model_id: str):
        """Get LLM instance with load balancing"""
        with self._lock:
            if model_id.startswith("ollama-"):
                model_key = model_id.replace("ollama-", "")
                if model_key in self._ollama_pools:
                    pool_data = self._ollama_pools[model_key]
                    llm = pool_data["pool"][pool_data["index"]]
                    pool_data["index"] = (pool_data["index"] + 1) % len(pool_data["pool"])
                    return llm
                else:
                    # Fallback to default
                    return self._ollama_pools["qwen2.5"]["pool"][0]
            
            elif model_id.startswith("sarvam-"):
                if self._sarvam_client:
                    return SarvamLLMWrapper(self._sarvam_client, model_id)
                else:
                    raise ValueError("Sarvam.ai client not available")
            
            # Default fallback
            return self._ollama_pools["qwen2.5"]["pool"][0]
    
    def update_metrics(self, model_id: str, response_time: float):
        """Update model performance metrics"""
        with self._lock:
            metrics = self._model_metrics[model_id]
            metrics["requests"] += 1
            # Exponential moving average
            alpha = 0.1
            metrics["avg_response_time"] = (
                alpha * response_time + 
                (1 - alpha) * metrics["avg_response_time"]
            )

class SarvamLLMWrapper:
    """Enhanced Sarvam.ai wrapper with better error handling"""
    
    def __init__(self, sarvam_client, model_id: str):
        self.client = sarvam_client
        self.model_name = self._get_model_name(model_id)
        self.temperature = 0.7
        self.max_tokens = 1024
    
    def _get_model_name(self, model_id: str) -> str:
        """Map model ID to actual Sarvam model name"""
        model_mapping = {
            "sarvam-m": "sarvam-m",
            "sarvam-2b": "sarvam-2b"
        }
        return model_mapping.get(model_id, "sarvam-m")
    
    def invoke(self, messages):
        """Enhanced invoke with better error handling and retries"""
        try:
            # Convert to Sarvam format
            sarvam_messages = []
            for msg in messages:
                role = "user"
                if hasattr(msg, "type"):
                    role = {"human": "user", "ai": "assistant", "system": "system"}.get(msg.type, "user")
                sarvam_messages.append({"role": role, "content": msg.content})
            
            # Ensure system message exists
            if not any(msg.get("role") == "system" for msg in sarvam_messages):
                sarvam_messages.insert(0, {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Be concise and accurate."
                })
            
            # API call with retry logic
            for attempt in range(3):
                try:
                    response = self.client.chat.completions(
                        messages=sarvam_messages,
                        temperature=self.temperature,
                        max_tokens=self.max_tokens,
                        stream=False
                    )
                    
                    content = response.choices[0].message.content
                    
                    class SarvamResponse:
                        def __init__(self, content):
                            self.content = content
                            self.type = "ai"
                    
                    return SarvamResponse(content)
                
                except Exception as e:
                    if attempt == 2:  # Last attempt
                        raise e
                    time.sleep(0.5 * (attempt + 1))  # Exponential backoff
        
        except Exception as e:
            class ErrorResponse:
                def __init__(self, error_msg):
                    self.content = f"Error with {self.model_name}: {error_msg}"
                    self.type = "ai"
            
            return ErrorResponse(str(e))

# Initialize enhanced LLM manager
llm_manager = EnhancedMultiModelLLM()

# ------------------------------------------------------------------
# INTELLIGENT TOOL LOADING SYSTEM
# ------------------------------------------------------------------

class IntelligentToolLoader:
    """Smart tool loading with context-aware selection"""
    
    def __init__(self):
        self._all_tools = None
        self._tool_categories = {}
        self._usage_stats = defaultdict(int)
        self._load_tools()
    
    def _load_tools(self):
        """Load and categorize tools"""
        try:
            from tools import (
                get_weather, wikipedia_lookup, web_search, latest_news,
                search_tracks, play_smart_track, current_track, pause_music,
                skip_track, add_to_playlist, set_volume, get_lyrics,
                sequential_think, sequential_review, generate_image,
                process_resume, scrapingant_page
            )
            
            # Categorize tools for intelligent selection
            self._tool_categories = {
                "core": [get_weather, wikipedia_lookup, web_search, latest_news],
                "music": [search_tracks, play_smart_track, current_track, 
                         pause_music, skip_track, add_to_playlist, set_volume, get_lyrics],
                "analysis": [sequential_think, sequential_review],
                "creative": [generate_image],
                "productivity": [process_resume, scrapingant_page]
            }
            
            # Flatten all tools
            self._all_tools = []
            for tools in self._tool_categories.values():
                self._all_tools.extend(tools)
                
        except ImportError as e:
            print(f"Warning: Tool loading error: {e}")
            self._all_tools = []
    
    @lru_cache(maxsize=128)
    def get_relevant_tools(self, user_input: str) -> List:
        """Get contextually relevant tools with caching"""
        if not self._all_tools:
            return []
        
        user_lower = user_input.lower()
        relevant_tools = []
        
        # Always include core tools for basic functionality
        relevant_tools.extend(self._tool_categories["core"])
        
        # Context-aware tool selection
        tool_keywords = {
            "music": ["music", "song", "play", "spotify", "track", "album", "artist", "lyrics"],
            "analysis": ["think", "analyze", "reason", "sequential", "logic", "step"],
            "creative": ["image", "picture", "generate", "create", "draw", "art"],
            "productivity": ["resume", "cv", "scrape", "website", "pdf", "document"]
        }
        
        for category, keywords in tool_keywords.items():
            if any(keyword in user_lower for keyword in keywords):
                relevant_tools.extend(self._tool_categories.get(category, []))
                self._usage_stats[category] += 1
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tools = []
        for tool in relevant_tools:
            if tool.name not in seen:
                unique_tools.append(tool)
                seen.add(tool.name)
        
        return unique_tools
    
    def get_usage_stats(self) -> Dict[str, int]:
        """Get tool usage statistics"""
        return dict(self._usage_stats)

tool_loader = IntelligentToolLoader()

# ------------------------------------------------------------------
# ADVANCED MEMORY MANAGEMENT
# ------------------------------------------------------------------

class AdvancedMemoryManager:
    """Enhanced memory management with compression and cleanup"""
    
    def __init__(self):
        self.memories = {}
        self.conversation_summaries = {}
        self.last_cleanup = time.time()
        self._lock = threading.RLock()
    
    def get_memory(self, thread_id: str):
        """Get or create memory for thread"""
        with self._lock:
            if thread_id not in self.memories:
                self.memories[thread_id] = {
                    'memory': MemorySaver(),
                    'last_used': time.time(),
                    'message_count': 0
                }
            
            self.memories[thread_id]['last_used'] = time.time()
            
            # Periodic cleanup
            if time.time() - self.last_cleanup > config.memory_cleanup_interval:
                self._cleanup_memories()
            
            return self.memories[thread_id]['memory']
    
    def _cleanup_memories(self):
        """Intelligent memory cleanup with conversation summarization"""
        current_time = time.time()
        cutoff_time = current_time - (2 * config.memory_cleanup_interval)
        
        to_remove = []
        for thread_id, data in self.memories.items():
            if data['last_used'] < cutoff_time:
                # Summarize long conversations before removal
                if data['message_count'] > 20:
                    self._summarize_conversation(thread_id, data['memory'])
                to_remove.append(thread_id)
        
        for thread_id in to_remove:
            del self.memories[thread_id]
        
        self.last_cleanup = current_time
        if to_remove:
            print(f"Cleaned up {len(to_remove)} conversation memories")
    
    def _summarize_conversation(self, thread_id: str, memory):
        """Create conversation summary for long-term storage"""
        try:
            # This would integrate with LLM to create summaries
            # For now, store basic metadata
            self.conversation_summaries[thread_id] = {
                'summary': f"Conversation with {memory}",
                'timestamp': time.time(),
                'message_count': self.memories[thread_id]['message_count']
            }
        except Exception:
            pass

memory_manager = AdvancedMemoryManager()

# ------------------------------------------------------------------
# HIGH-PERFORMANCE RESPONSE CACHE
# ------------------------------------------------------------------

class HighPerformanceCache:
    """Thread-safe LRU cache with TTL and compression"""
    
    def __init__(self, max_size: int = config.max_cache_size, ttl: int = config.cache_ttl):
        self.cache = {}
        self.access_order = {}
        self.max_size = max_size
        self.ttl = ttl
        self._lock = threading.RLock()
        self.hit_count = 0
        self.miss_count = 0
    
    def _generate_key(self, user_input: str, thread_id: str, model_id: str = "") -> str:
        """Generate normalized cache key"""
        normalized_input = re.sub(r'\s+', ' ', user_input.strip().lower())
        return f"{thread_id}:{model_id}:{hash(normalized_input)}"
    
    def get(self, user_input: str, thread_id: str, model_id: str = "") -> Optional[Dict]:
        """Get cached response with LRU tracking"""
        with self._lock:
            key = self._generate_key(user_input, thread_id, model_id)
            
            if key in self.cache:
                cached_data = self.cache[key]
                
                # Check TTL
                if time.time() - cached_data['timestamp'] < self.ttl:
                    # Update access order for LRU
                    self.access_order[key] = time.time()
                    self.hit_count += 1
                    return cached_data['response']
                else:
                    # Remove expired entry
                    del self.cache[key]
                    self.access_order.pop(key, None)
            
            self.miss_count += 1
            return None
    
    def set(self, user_input: str, thread_id: str, response: Dict, model_id: str = ""):
        """Cache response with LRU eviction"""
        with self._lock:
            key = self._generate_key(user_input, thread_id, model_id)
            
            # Evict if at capacity
            if len(self.cache) >= self.max_size:
                self._evict_lru()
            
            self.cache[key] = {
                'response': response,
                'timestamp': time.time()
            }
            self.access_order[key] = time.time()
    
    def _evict_lru(self):
        """Evict least recently used entries"""
        if self.access_order:
            lru_key = min(self.access_order.items(), key=lambda x: x[1])[0]
            self.cache.pop(lru_key, None)
            self.access_order.pop(lru_key, None)
    
    def get_stats(self) -> Dict:
        """Get cache performance statistics"""
        total_requests = self.hit_count + self.miss_count
        hit_rate = self.hit_count / total_requests if total_requests > 0 else 0
        
        return {
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate": hit_rate,
            "cache_size": len(self.cache)
        }

response_cache = HighPerformanceCache()

# Enhanced system prompt for better reasoning (integrated into LLM configuration)
ENHANCED_SYSTEM_PROMPT = """You are an intelligent AI assistant with advanced reasoning capabilities. Follow these guidelines:
!! ALWAYS ANSWER THE USER WITH CORRECT USEFUL RESPONSE !!
REASONING APPROACH:
- Think step-by-step for complex problems
- Use tools strategically when they add value
- Provide complete answers
- Acknowledge when you need more information

TOOL USAGE PRINCIPLES:
- Use tools only when necessary to answer the question
- Prefer efficient single-tool solutions over multiple tool calls
- Always validate tool results before responding
- If a tool fails, explain why and offer alternatives
- If the user's prompt is anything related to sound, then its about the spotify song volume , so use set_volume

RESPONSE QUALITY:
- Be direct and actionable
- Provide context when helpful
- Use clear, professional language
- Structure complex information logically

PERFORMANCE FOCUS:
- Prioritize speed without sacrificing accuracy
- Avoid redundant operations
- Give users what they need most efficiently"""

# ------------------------------------------------------------------
# OPTIMIZED AGENT EXECUTION ENGINE
# ------------------------------------------------------------------

def run_agent_optimized(
    user_input: str, 
    thread_id: str = "default", 
    model_id: str = "auto"
) -> Dict[str, Any]:
    """
    High-performance agent execution with intelligent routing
    """
    start_time = time.time()
    
    # Input validation
    if not user_input or not user_input.strip():
        return {
            "response": "Please provide a question or request.",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": "none"
        }
    
    # Intelligent model selection
    if model_id == "auto":
        model_id = llm_manager.get_optimal_model(user_input)
    
    print(f"Processing with model: {model_id}")
    
    # Route based on model type
    if model_id.startswith("sarvam-"):
        return _execute_sarvam_chat(user_input, thread_id, model_id, start_time)
    elif GITHUB_AI_AVAILABLE and is_github_ai_model(model_id):
        return execute_github_ai_model(user_input, thread_id, model_id, start_time)
    else:
        return _execute_ollama_with_tools(user_input, thread_id, model_id, start_time)

def _execute_sarvam_chat(
    user_input: str, 
    thread_id: str, 
    model_id: str, 
    start_time: float
) -> Dict[str, Any]:
    """Execute Sarvam model for chat-only interactions"""
    try:
        # Check cache first
        cached_response = response_cache.get(user_input, thread_id, model_id)
        if cached_response:
            print(f"Cache hit - Response time: {(time.time() - start_time)*1000:.1f}ms")
            return cached_response
        
        llm = llm_manager.get_llm(model_id)
        
        # Build conversation context
        messages = [
            SystemMessage(content="You are a helpful AI assistant. Be concise and accurate."),
            HumanMessage(content=user_input)
        ]
        
        # Get response
        response = llm.invoke(messages)
        
        # Prepare final response
        final_response = {
            "response": response.content,
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "model_type": "sarvam_chat"
        }
        
        # Cache successful responses
        if "error" not in response.content.lower():
            response_cache.set(user_input, thread_id, final_response, model_id)
        
        # Update metrics
        llm_manager.update_metrics(model_id, final_response["execution_time"])
        
        return final_response
        
    except Exception as e:
        return {
            "response": f"I encountered an error with the {model_id} model: {str(e)}",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": str(e)
        }

def _execute_ollama_with_tools(
    user_input: str, 
    thread_id: str, 
    model_id: str, 
    start_time: float
) -> Dict[str, Any]:
    """Execute Ollama model with intelligent tool selection"""
    try:
        # Check cache first
        cached_response = response_cache.get(user_input, thread_id, model_id)
        if cached_response:
            print(f"Cache hit - Response time: {(time.time() - start_time)*1000:.1f}ms")
            return cached_response
        
        # Get optimized components
        llm = llm_manager.get_llm(model_id)
        memory = memory_manager.get_memory(thread_id)
        relevant_tools = tool_loader.get_relevant_tools(user_input)
        
        print(f"Using {len(relevant_tools)} relevant tools")
        
        # Create enhanced agent
        agent = create_react_agent(
            model=llm,
            tools=relevant_tools,
            checkpointer=memory,
            prompt=ENHANCED_SYSTEM_PROMPT
        )
        
        # Track tool usage
        state_before = agent.get_state({"configurable": {"thread_id": thread_id}})
        msg_count_before = len(state_before.values.get("messages", []))
        
        # Execute with timeout protection
        try:
            response = agent.invoke(
                {"messages": [HumanMessage(content=user_input)]},
                {"configurable": {"thread_id": thread_id}},
            )
        except Exception as e:
            return {
                "response": f"I encountered an execution error: {str(e)}",
                "tools_used": [],
                "execution_time": time.time() - start_time,
                "model_used": model_id,
                "error": str(e)
            }
        
        # Extract tools used and handle Spotify integration
        tools_used, spotify_track_id = _extract_tool_info(
            response["messages"][msg_count_before:]
        )
        
        # Check if sequential_think tool was used and get the reasoning steps
        sequential_thinking_steps = None
        if 'sequential_think' in tools_used:
            print(f"🧠 AI Core - Sequential thinking detected!")
            
            # Extract session ID from the tool call
            session_id = None
            for msg in response["messages"][msg_count_before:]:
                if isinstance(msg, AIMessage) and msg.tool_calls:
                    for tc in msg.tool_calls:
                        if tc.get("name") == "sequential_think":
                            # Look for the corresponding tool message
                            tool_output_index = response["messages"].index(msg) + 1
                            if tool_output_index < len(response["messages"]):
                                tool_msg = response["messages"][tool_output_index]
                                if isinstance(tool_msg, ToolMessage):
                                    # Extract session ID from tool output
                                    match = re.search(r'session_id: ([a-zA-Z0-9_]+)', tool_msg.content)
                                    if match:
                                        session_id = match.group(1)
                                        print(f"🧠 AI Core - Found sequential thinking session ID: {session_id}")
            
            # If we have a session ID, load the thinking steps
            if session_id:
                try:
                    # Import here to avoid circular imports
                    import pathlib
                    import json
                    
                    # Load thinking steps directly from file
                    seq_file_path = pathlib.Path(__file__).parent / "sequential_memory" / f"{session_id}.jsonl"
                    if seq_file_path.exists():
                        sequential_thinking_steps = []
                        with open(seq_file_path, 'r') as f:
                            for line in f:
                                sequential_thinking_steps.append(json.loads(line))
                        print(f"🧠 AI Core - Loaded {len(sequential_thinking_steps)} thinking steps")
                except Exception as e:
                    print(f"🧠 AI Core - Error loading sequential thinking steps: {e}")
        
        # Prepare final response
        final_response = {
            "response": response["messages"][-1].content,
            "tools_used": tools_used,
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "model_type": "ollama_with_tools"
        }
        
        # Add sequential thinking steps if available
        if sequential_thinking_steps and len(sequential_thinking_steps) > 0:
            # Format the steps into a readable format for display
            thinking_formatted = "\n\n### My Reasoning Process:\n\n"
            for step in sequential_thinking_steps:
                thinking_formatted += f"**Step {step['step'] + 1}:** {step['text']}\n\n"
            
            # Append the thinking steps to the response
            final_response["response"] = final_response["response"] + thinking_formatted
            print(f"🧠 AI Core - Added sequential thinking steps to response")
        
        # Add Spotify track ID if available
        if spotify_track_id:
            final_response["spotify_track_id"] = spotify_track_id
        
        # Cache successful responses
        if not any(word in final_response["response"].lower() 
                  for word in ["error", "failed", "couldn't"]):
            response_cache.set(user_input, thread_id, final_response, model_id)
        
        # Update metrics
        llm_manager.update_metrics(model_id, final_response["execution_time"])
        
        return final_response
        
    except Exception as e:
        return {
            "response": f"I encountered an error processing your request: {str(e)}",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": str(e)
        }

def _extract_tool_info(messages: List) -> tuple[List[str], Optional[str]]:
    """Extract tool usage information and Spotify track ID"""
    tools_used = []
    spotify_track_id = None
    
    for msg in messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tool_call in msg.tool_calls:
                tool_name = tool_call.get("name")
                if tool_name:
                    tools_used.append(tool_name)
    
    # Handle Spotify integration
    spotify_tools = ['play_smart_track', 'current_track', 'play', 'music', 'song', 'track']
    if any(tool in spotify_tools for tool in tools_used):
        print(f"🎵 AI Core - Spotify tool detected in: {tools_used}")
        
        # Method 1: Get track ID from global variable (most reliable)
        try:
            from tools import get_last_played_track_id, clear_last_played_track_id
            spotify_track_id = get_last_played_track_id()
            print(f"🎵 AI Core - Retrieved Track ID from global: {spotify_track_id}")
            
            if spotify_track_id:
                # Only clear after we've successfully retrieved it
                clear_last_played_track_id()
                print(f"🎵 AI Core - Cleared global track ID after retrieval")
            else:
                print(f"🎵 AI Core - No track ID found in global variable")
        except ImportError:
            print(f"🎵 AI Core - Error importing track ID functions")
        
        # Method 2: Extract track ID from response text if not found in global
        if not spotify_track_id:
            print(f"🎵 AI Core - Trying to extract track ID from response text")
            
            # Look for the last message content (AI response)
            for msg in reversed(messages):
                if isinstance(msg, AIMessage) and msg.content:
                    response_text = msg.content
                    
                    # Look for our standard format first
                    track_id_match = re.search(r'\[TRACK_ID:([a-zA-Z0-9]{22})\]', response_text)
                    if track_id_match:
                        spotify_track_id = track_id_match.group(1)
                        print(f"🎵 AI Core - Extracted track ID from response: {spotify_track_id}")
                        break
                    
                    # Try other common patterns
                    patterns = [
                        r'spotify\.com\/track\/([a-zA-Z0-9]{22})',
                        r'spotify:track:([a-zA-Z0-9]{22})',
                        r'track ID: ([a-zA-Z0-9]{22})',
                        r'track_id: ([a-zA-Z0-9]{22})'
                    ]
                    
                    for pattern in patterns:
                        match = re.search(pattern, response_text)
                        if match:
                            spotify_track_id = match.group(1)
                            print(f"🎵 AI Core - Extracted track ID using pattern: {spotify_track_id}")
                            break
                    
                    if spotify_track_id:
                        break
    
    if spotify_track_id:
        print(f"🎵 AI Core - SUCCESS - Will include track ID in response: {spotify_track_id}")
    else:
        print(f"🎵 AI Core - WARNING - No track ID available")
    
    return tools_used, spotify_track_id

# ------------------------------------------------------------------
# ASYNC EXECUTION FOR CONCURRENT REQUESTS
# ------------------------------------------------------------------

async def run_agent_async(
    user_input: str, 
    thread_id: str = "default", 
    model_id: str = "auto"
) -> Dict[str, Any]:
    """
    Async version for handling multiple concurrent requests
    """
    loop = asyncio.get_event_loop()
    
    with ThreadPoolExecutor(max_workers=config.pool_size) as executor:
        result = await loop.run_in_executor(
            executor,
            run_agent_optimized,
            user_input,
            thread_id,
            model_id
        )
    
    return result

# ------------------------------------------------------------------
# PERFORMANCE MONITORING AND DIAGNOSTICS
# ------------------------------------------------------------------

def get_performance_stats() -> Dict[str, Any]:
    """Get comprehensive performance statistics"""
    return {
        "cache_stats": response_cache.get_stats(),
        "tool_usage": tool_loader.get_usage_stats(),
        "model_metrics": dict(llm_manager._model_metrics),
        "memory_usage": {
            "active_conversations": len(memory_manager.memories),
            "conversation_summaries": len(memory_manager.conversation_summaries)
        }
    }

def reset_performance_stats():
    """Reset all performance counters"""
    response_cache.hit_count = 0
    response_cache.miss_count = 0
    tool_loader._usage_stats.clear()
    llm_manager._model_metrics.clear()

# ------------------------------------------------------------------
# HEALTH CHECK AND DIAGNOSTICS
# ------------------------------------------------------------------

def health_check() -> Dict[str, str]:
    """Perform system health check"""
    status = {"overall": "healthy"}
    
    try:
        # Test Ollama connection
        test_llm = llm_manager.get_llm("ollama-qwen2.5")
        test_response = test_llm.invoke([HumanMessage(content="test")])
        status["ollama"] = "healthy" if test_response else "unhealthy"
    except Exception as e:
        status["ollama"] = f"error: {str(e)}"
    
    try:
        # Test Sarvam connection if available
        if llm_manager._sarvam_client:
            test_sarvam = llm_manager.get_llm("sarvam-m")
            test_response = test_sarvam.invoke([HumanMessage(content="test")])
            status["sarvam"] = "healthy" if test_response else "unhealthy"
        else:
            status["sarvam"] = "not_configured"
    except Exception as e:
        status["sarvam"] = f"error: {str(e)}"
    
    # Check tools
    try:
        tools = tool_loader.get_relevant_tools("test")
        status["tools"] = f"healthy ({len(tools)} available)"
    except Exception as e:
        status["tools"] = f"error: {str(e)}"
    
    # Overall status
    if any("error" in v for v in status.values() if v != status["overall"]):
        status["overall"] = "degraded"
    
    return status