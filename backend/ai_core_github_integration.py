"""
AI Core GitHub Integration - Fixed version with proper tool parameter handling
"""
import time
import re
import json
from typing import Dict, List, Any, Optional

# Import LangChain components for proper tool integration
try:
    from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
    from langchain_core.language_models.base import BaseLanguageModel
    from langchain_core.callbacks import CallbackManagerForLLMRun
    from langchain_core.outputs import LLMResult, Generation
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.prebuilt import create_react_agent
    LANGCHAIN_AVAILABLE = True
except ImportError:
    print("⚠️ LangChain components not available.")
    LANGCHAIN_AVAILABLE = False

# Import GitHub AI models
try:
    from github_ai_models import (
        github_ai_complete, 
        get_available_models,
        GITHUB_AI_MODELS
    )
    GITHUB_AI_AVAILABLE = True
except ImportError:
    print("⚠️ GitHub AI models not available.")
    GITHUB_AI_AVAILABLE = False

# Import tools with better error handling
try:
    from tools import (
        get_weather, wikipedia_lookup, web_search, latest_news,
        search_tracks, play_smart_track, current_track, pause_music,
        skip_track, add_to_playlist, set_volume, get_lyrics,
        sequential_think, sequential_review, generate_image,
        process_resume, scrapingant_page, get_last_played_track_id,
        clear_last_played_track_id
    )
    TOOLS_AVAILABLE = True
    
    # Define tool categories for intelligent selection
    TOOL_CATEGORIES = {
        "core": [get_weather, wikipedia_lookup, web_search, latest_news],
        "music": [search_tracks, play_smart_track, current_track, 
                 pause_music, skip_track, add_to_playlist, set_volume, get_lyrics],
        "analysis": [sequential_think, sequential_review],
        "creative": [generate_image],
        "productivity": [process_resume, scrapingant_page]
    }
    
    # Flatten all tools
    ALL_TOOLS = []
    for tools in TOOL_CATEGORIES.values():
        ALL_TOOLS.extend(tools)
    
    # Create tool lookup dictionary
    TOOL_LOOKUP = {tool.name: tool for tool in ALL_TOOLS}
    
    print(f"✅ Loaded {len(ALL_TOOLS)} tools for GitHub AI models")
except ImportError as e:
    print(f"⚠️ Error loading tools for GitHub AI models: {e}")
    TOOLS_AVAILABLE = False
    ALL_TOOLS = []
    TOOL_LOOKUP = {}

def extract_tool_parameters(user_input: str, tool_name: str) -> Dict[str, Any]:
    """
    Extract parameters for a specific tool from user input with better parsing.
    """
    user_lower = user_input.lower()
    params = {}
    
    try:
        if tool_name == "get_weather":
            # Look for location patterns
            location_patterns = [
                r"weather\s+(?:in|at|for)\s+([A-Za-z\s,]+?)(?:\s|$|[.!?])",
                r"(?:what's|whats)\s+(?:the\s+)?weather\s+(?:like\s+)?(?:in|at|for)\s+([A-Za-z\s,]+?)(?:\s|$|[.!?])",
                r"temperature\s+(?:in|at|for)\s+([A-Za-z\s,]+?)(?:\s|$|[.!?])",
                r"forecast\s+(?:in|at|for)\s+([A-Za-z\s,]+?)(?:\s|$|[.!?])",
            ]
            
            for pattern in location_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    # Clean up common endings
                    location = re.sub(r'\s+(and|then|please|today|tomorrow).*$', '', location, flags=re.IGNORECASE)
                    params["location"] = location
                    break
            
            # Default to a generic location if none found
            if not params.get("location"):
                params["location"] = "New York"  # Default location
                
        elif tool_name == "play_smart_track":
            # Extract song/artist from various patterns
            music_patterns = [
                r"(?:play|change\s+(?:the\s+)?song\s+to|put\s+on)\s+(.+?)(?:\s+(?:and|then|please)|$)",
                r"(?:song|track|music)\s+(.+?)(?:\s+(?:and|then|please)|$)",
                r"artist\s+(.+?)(?:\s+(?:and|then|please)|$)",
            ]
            
            for pattern in music_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    query = match.group(1).strip()
                    # Clean up common words
                    query = re.sub(r'\s+(and|then|please|now).*$', '', query, flags=re.IGNORECASE)
                    params["query"] = query
                    break
                    
            if not params.get("query"):
                # Extract anything after "play" as fallback
                play_match = re.search(r"play\s+(.+)", user_input, re.IGNORECASE)
                if play_match:
                    params["query"] = play_match.group(1).strip()
                else:
                    params["query"] = "popular song"  # Default fallback
                    
        elif tool_name == "set_volume":
            # Extract volume percentage
            volume_patterns = [
                r"volume\s+(?:to\s+)?(\d+)",
                r"set\s+(?:the\s+)?volume\s+(?:to\s+)?(\d+)",
                r"volume\s+(?:at\s+)?(\d+)\s*%",
            ]
            
            for pattern in volume_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    volume = int(match.group(1))
                    params["percent"] = max(0, min(100, volume))  # Clamp to 0-100
                    break
                    
            if not params.get("percent"):
                params["percent"] = 50  # Default volume
                
        elif tool_name == "wikipedia_lookup":
            # Extract topic for Wikipedia lookup
            wiki_patterns = [
                r"(?:about|wikipedia|lookup|information\s+(?:about|on))\s+(.+?)(?:\s+(?:and|then|please)|$)",
                r"(?:what\s+is|tell\s+me\s+about)\s+(.+?)(?:\s+(?:and|then|please)|$)",
                r"(?:define|explain)\s+(.+?)(?:\s+(?:and|then|please)|$)",
            ]
            
            for pattern in wiki_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    title = match.group(1).strip()
                    title = re.sub(r'\s+(and|then|please).*$', '', title, flags=re.IGNORECASE)
                    params["title"] = title
                    break
                    
            if not params.get("title"):
                # Extract main subject as fallback
                words = user_input.split()
                if len(words) > 1:
                    params["title"] = " ".join(words[-2:])  # Last two words as topic
                else:
                    params["title"] = "python programming"  # Default topic
                    
        elif tool_name == "web_search":
            # Extract search query
            search_patterns = [
                r"(?:search|look\s+up|find)\s+(?:for\s+)?(.+?)(?:\s+(?:and|then|please)|$)",
                r"(?:google|search)\s+(.+?)(?:\s+(?:and|then|please)|$)",
            ]
            
            for pattern in search_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    query = match.group(1).strip()
                    query = re.sub(r'\s+(and|then|please).*$', '', query, flags=re.IGNORECASE)
                    params["query"] = query
                    break
                    
            if not params.get("query"):
                params["query"] = user_input.strip()  # Use full input as fallback
                
        elif tool_name == "sequential_think":
            params["thought"] = user_input
            params["session_id"] = "github_ai_session"  # Use consistent session ID
            params["branch_from"] = "None"
            params["operation"] = "append"
            
        elif tool_name == "generate_image":
            # Extract image description
            image_patterns = [
                r"(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|photo)\s+(?:of\s+)?(.+?)(?:\s+(?:and|then|please)|$)",
                r"(?:image|picture|photo)\s+(?:of\s+)?(.+?)(?:\s+(?:and|then|please)|$)",
            ]
            
            for pattern in image_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    prompt = match.group(1).strip()
                    prompt = re.sub(r'\s+(and|then|please).*$', '', prompt, flags=re.IGNORECASE)
                    params["prompt"] = prompt
                    break
                    
            if not params.get("prompt"):
                params["prompt"] = user_input.strip()  # Use full input as fallback
                
        else:
            # For tools we don't have specific parameter extraction
            # Try to use the first parameter from the tool's schema if available
            if hasattr(TOOL_LOOKUP.get(tool_name), 'args_schema'):
                schema = TOOL_LOOKUP[tool_name].args_schema
                if hasattr(schema, '__fields__'):
                    first_field = next(iter(schema.__fields__.keys()), None)
                    if first_field:
                        params[first_field] = user_input.strip()
            else:
                # Fallback: use common parameter names
                if "query" in str(TOOL_LOOKUP.get(tool_name, "")):
                    params["query"] = user_input.strip()
                elif "text" in str(TOOL_LOOKUP.get(tool_name, "")):
                    params["text"] = user_input.strip()
                else:
                    params["input"] = user_input.strip()
                    
    except Exception as e:
        print(f"⚠️ Error extracting parameters for {tool_name}: {e}")
        # Return safe defaults
        if tool_name == "get_weather":
            params["location"] = "New York"
        elif tool_name == "set_volume":
            params["percent"] = 50
        else:
            params["query"] = user_input.strip()
    
    return params

def determine_tools_needed(user_input: str) -> List[str]:
    """
    Determine which tools should be used based on user input with better intent detection.
    """
    user_lower = user_input.lower()
    tools_needed = []
    
    # Weather detection - be more specific
    weather_keywords = ["weather", "temperature", "forecast", "climate", "hot", "cold", "rain", "snow"]
    if any(keyword in user_lower for keyword in weather_keywords):
        tools_needed.append("get_weather")
    
    # Music detection - distinguish between search and play
    play_keywords = ["play", "change song", "change the song", "put on", "start playing"]
    search_keywords = ["search for songs", "find songs", "look for music", "search music"]
    
    if any(keyword in user_lower for keyword in play_keywords):
        tools_needed.append("play_smart_track")
    elif any(keyword in user_lower for keyword in search_keywords):
        tools_needed.append("search_tracks")
    
    # Volume control
    if "volume" in user_lower and any(word in user_lower for word in ["set", "change", "turn", "up", "down"]):
        tools_needed.append("set_volume")
    
    # Music control
    if "pause" in user_lower and "music" in user_lower:
        tools_needed.append("pause_music")
    if "skip" in user_lower and ("song" in user_lower or "track" in user_lower):
        tools_needed.append("skip_track")
    if "current" in user_lower and ("song" in user_lower or "track" in user_lower or "playing" in user_lower):
        tools_needed.append("current_track")
    
    # Information lookup
    info_keywords = ["what is", "tell me about", "information about", "explain", "define", "wikipedia"]
    if any(keyword in user_lower for keyword in info_keywords):
        tools_needed.append("wikipedia_lookup")
    
    # Web search
    search_keywords = ["search", "google", "look up", "find information"]
    if any(keyword in user_lower for keyword in search_keywords) and "wikipedia" not in user_lower:
        tools_needed.append("web_search")
    
    # News
    if any(keyword in user_lower for keyword in ["news", "headlines", "latest news", "current events"]):
        tools_needed.append("latest_news")
    
    # Sequential thinking
    thinking_keywords = ["step by step", "sequential", "think", "reasoning", "process", "analyze", "break down"]
    if any(keyword in user_lower for keyword in thinking_keywords):
        tools_needed.append("sequential_think")
    
    # Image generation
    image_keywords = ["generate image", "create image", "make image", "draw", "picture"]
    if any(keyword in user_lower for keyword in image_keywords):
        tools_needed.append("generate_image")
    
    return tools_needed

def execute_tool_safely(tool_name: str, params: Dict[str, Any]) -> str:
    """
    Execute a tool with proper error handling and parameter validation.
    """
    if tool_name not in TOOL_LOOKUP:
        return f"Tool '{tool_name}' not found"
    
    tool_func = TOOL_LOOKUP[tool_name]
    
    try:
        print(f"🔧 Executing {tool_name} with params: {params}")
        
        # Handle special tools with different invoke patterns
        if tool_name == "sequential_think":
            # Sequential think has specific parameter names
            result = tool_func.invoke({
                "thought": params.get("thought", ""),
                "session_id": params.get("session_id", "github_ai_session"),
                "branch_from": params.get("branch_from", "None"),
                "operation": params.get("operation", "append")
            })
        elif tool_name == "set_volume":
            # Volume tool expects 'percent' parameter
            result = tool_func.invoke({"percent": params.get("percent", 50)})
        elif hasattr(tool_func, 'invoke'):
            # Use invoke method for LangChain tools
            result = tool_func.invoke(params)
        else:
            # Fallback to direct function call
            if len(params) == 1:
                # Single parameter - pass directly
                param_value = next(iter(params.values()))
                result = tool_func(param_value)
            else:
                # Multiple parameters - pass as kwargs
                result = tool_func(**params)
        
        return str(result)
        
    except Exception as e:
        error_msg = f"Error executing {tool_name}: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

def execute_github_ai_model_fixed(
    user_input: str,
    thread_id: str,
    model_id: str,
    start_time: float,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute GitHub AI model with proper tool integration and parameter handling.
    """
    if not GITHUB_AI_AVAILABLE:
        return {
            "response": "GitHub AI models are not available.",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": "GitHub AI models not available"
        }
    
    try:
        # Determine which tools to use
        tools_needed = determine_tools_needed(user_input)
        print(f"📋 Determined tools needed: {tools_needed}")
        
        # Execute tools and collect results
        tool_results = []
        tools_used = []
        spotify_track_id = None
        
        for tool_name in tools_needed:
            if tool_name in TOOL_LOOKUP:
                # Extract parameters for this specific tool
                params = extract_tool_parameters(user_input, tool_name)
                
                # Execute the tool
                result = execute_tool_safely(tool_name, params)
                
                tool_results.append({
                    "tool": tool_name,
                    "params": params,
                    "result": result
                })
                tools_used.append(tool_name)
                
                # Handle Spotify track ID extraction
                if tool_name == "play_smart_track":
                    try:
                        # Try to extract track ID from result
                        track_id_match = re.search(r'\[TRACK_ID:([a-zA-Z0-9]+)\]', result)
                        if track_id_match:
                            spotify_track_id = track_id_match.group(1)
                            print(f"🎵 GitHub AI - Extracted Track ID from result: {spotify_track_id}")
                        
                        # Also try to get from global variable
                        if not spotify_track_id:
                            spotify_track_id = get_last_played_track_id()
                            if spotify_track_id:
                                print(f"🎵 GitHub AI - Retrieved Track ID from global: {spotify_track_id}")
                                clear_last_played_track_id()
                    except Exception as e:
                        print(f"⚠️ Error handling Spotify track ID: {e}")
        
        # Create comprehensive prompt for GitHub AI
        if tool_results:
            # Build context with tool results
            context = "I executed the following tools for you:\n\n"
            for result in tool_results:
                context += f"**{result['tool']}** (with {result['params']}): {result['result']}\n\n"
            
            # Ask GitHub AI to create a comprehensive response
            full_prompt = f"""User request: "{user_input}"

{context}

Please provide a comprehensive, natural response that:
1. Addresses the user's original request
2. Incorporates the tool results naturally
3. Is helpful and conversational
4. Doesn't mention technical details about tool execution

Response:"""
            
            ai_result = github_ai_complete(
                full_prompt, 
                model_id, 
                "You are a helpful AI assistant. Provide natural, comprehensive responses based on the tool results provided. Don't mention technical details about tool execution."
            )
            
            if "error" in ai_result:
                # Fallback response if AI fails
                response_text = f"I've completed your request:\n\n"
                for result in tool_results:
                    response_text += f"• **{result['tool']}**: {result['result']}\n"
            else:
                response_text = ai_result["content"]
        else:
            # No tools needed, use GitHub AI directly
            ai_result = github_ai_complete(user_input, model_id, system_prompt)
            if "error" in ai_result:
                response_text = f"Error: {ai_result['error']}"
            else:
                response_text = ai_result["content"]
        
        # Prepare final response
        final_response = {
            "response": response_text,
            "tools_used": tools_used,
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "model_type": "github_ai_with_fixed_tools"
        }
        
        if spotify_track_id:
            final_response["spotify_track_id"] = spotify_track_id
        
        print(f"✅ GitHub AI execution completed. Tools used: {tools_used}")
        return final_response
        
    except Exception as e:
        error_msg = f"Error with GitHub AI model: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "response": error_msg,
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": str(e)
        }

# Create a LangChain-compatible wrapper for GitHub AI models (improved version)
class GitHubAILangChainWrapper:
    """Improved wrapper for GitHub AI models that works with LangChain tools"""
    
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.model_name = model_id
    
    def invoke(self, messages, **kwargs):
        """Invoke the model with messages and proper tool integration"""
        try:
            # Handle different input formats
            if isinstance(messages, dict) and "messages" in messages:
                message_list = messages["messages"]
            elif isinstance(messages, list):
                message_list = messages
            else:
                message_list = [HumanMessage(content=str(messages))]
            
            # Extract user input from messages
            user_input = ""
            system_prompt = ""
            
            for msg in message_list:
                if isinstance(msg, HumanMessage):
                    user_input = msg.content
                elif isinstance(msg, SystemMessage):
                    system_prompt = msg.content
            
            # Use our improved execution function
            result = execute_github_ai_model_fixed(
                user_input=user_input,
                thread_id="langchain_session",
                model_id=self.model_id,
                start_time=time.time(),
                system_prompt=system_prompt
            )
            
            if "error" in result:
                content = f"Error: {result['error']}"
            else:
                content = result["response"]
            
            # Return AIMessage for compatibility
            return AIMessage(content=content)
            
        except Exception as e:
            return AIMessage(content=f"Error: {str(e)}")
    
    def bind_tools(self, tools):
        """Bind tools to the model (for compatibility)"""
        return self
    
    @property
    def _llm_type(self) -> str:
        return "github_ai_fixed"

def get_github_ai_models() -> List[Dict]:
    """Get list of available GitHub AI models"""
    if not GITHUB_AI_AVAILABLE:
        return []
    
    return get_available_models()

def is_github_ai_model(model_id: str) -> bool:
    """Check if a model ID is a GitHub AI model"""
    if not GITHUB_AI_AVAILABLE:
        return False
    
    return model_id in GITHUB_AI_MODELS

# Export the main execution function for external use
execute_github_ai_model = execute_github_ai_model_fixed