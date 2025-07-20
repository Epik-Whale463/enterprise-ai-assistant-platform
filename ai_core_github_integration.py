"""
AI Core GitHub Integration - Integrates GitHub AI models with the existing AI core using proper LangChain
"""
import time
import re
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

# Import tools
try:
    from tools import (
        get_weather, wikipedia_lookup, web_search, latest_news,
        search_tracks, play_smart_track, current_track, pause_music,
        skip_track, add_to_playlist, set_volume, get_lyrics,
        sequential_think, sequential_review, generate_image,
        process_resume, scrapingant_page
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
    
    print(f"✅ Loaded {len(ALL_TOOLS)} tools for GitHub AI models")
except ImportError as e:
    print(f"⚠️ Error loading tools for GitHub AI models: {e}")
    TOOLS_AVAILABLE = False
    ALL_TOOLS = []

# Create a LangChain-compatible wrapper for GitHub AI models
class GitHubAILangChainWrapper:
    """Simple wrapper for GitHub AI models that works with LangChain tools"""
    
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.model_name = model_id
    
    def invoke(self, messages, **kwargs):
        """Invoke the model with messages"""
        try:
            # Handle different input formats
            if isinstance(messages, dict) and "messages" in messages:
                message_list = messages["messages"]
            elif isinstance(messages, list):
                message_list = messages
            else:
                message_list = [HumanMessage(content=str(messages))]
            
            # Build conversation context
            user_input = ""
            system_prompt = ""
            conversation_context = ""
            
            for msg in message_list:
                if isinstance(msg, HumanMessage):
                    user_input = msg.content
                elif isinstance(msg, SystemMessage):
                    system_prompt = msg.content
                elif isinstance(msg, AIMessage):
                    conversation_context += f"Assistant: {msg.content}\n"
                elif isinstance(msg, ToolMessage):
                    conversation_context += f"Tool Result: {msg.content}\n"
            
            # Combine context with current input
            if conversation_context:
                full_input = f"{conversation_context}\nUser: {user_input}"
            else:
                full_input = user_input
            
            # Call GitHub AI model
            result = github_ai_complete(full_input, self.model_id, system_prompt)
            
            if "error" in result:
                content = f"Error: {result['error']}"
            else:
                content = result["content"]
            
            # Return AIMessage for compatibility
            return AIMessage(content=content)
            
        except Exception as e:
            return AIMessage(content=f"Error: {str(e)}")
    
    def bind_tools(self, tools):
        """Bind tools to the model (for compatibility)"""
        return self
    
    @property
    def _llm_type(self) -> str:
        return "github_ai"

def get_relevant_tools(user_input: str) -> List:
    """Get contextually relevant tools based on user input with smart prioritization"""
    if not TOOLS_AVAILABLE:
        return []
    
    user_lower = user_input.lower()
    relevant_tools = []
    
    # Always include core tools for basic functionality
    relevant_tools.extend(TOOL_CATEGORIES["core"])
    
    # Enhanced context-aware tool selection with intent detection
    music_play_keywords = ["play", "change song", "change the song", "play music", "start playing", "put on"]
    music_search_keywords = ["search for songs", "find songs", "look for music", "search music"]
    weather_keywords = ["weather", "temperature", "forecast", "climate"]
    info_keywords = ["what is", "tell me about", "information about", "explain", "define"]
    news_keywords = ["news", "headlines", "latest news", "current events"]
    
    # Prioritize music tools based on specific intent
    if any(keyword in user_lower for keyword in music_play_keywords + music_search_keywords + ["music", "song", "track", "album", "artist", "lyrics"]):
        relevant_tools.extend(TOOL_CATEGORIES.get("music", []))
    
    # Add other categories based on keywords
    tool_keywords = {
        "analysis": ["think", "analyze", "reason", "sequential", "logic", "step"],
        "creative": ["image", "picture", "generate", "create", "draw", "art"],
        "productivity": ["resume", "cv", "scrape", "website", "pdf", "document"]
    }
    
    for category, keywords in tool_keywords.items():
        if any(keyword in user_lower for keyword in keywords):
            relevant_tools.extend(TOOL_CATEGORIES.get(category, []))
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tools = []
    for tool in relevant_tools:
        if tool.name not in seen:
            unique_tools.append(tool)
            seen.add(tool.name)
    
    return unique_tools

def extract_and_execute_tools(response_content: str, user_input: str) -> tuple[List[str], str, Optional[str]]:
    """
    Extract tool usage from response content, execute the tools, and update the response
    
    Returns:
        tuple: (tools_used, updated_response, spotify_track_id)
    """
    tools_used = []
    spotify_track_id = None
    updated_response = response_content
    
    # Look for tool usage patterns in the response
    tool_patterns = [
        r"I used the (\w+) tool",
        r"Using the (\w+) tool",
        r"I'll use the (\w+) tool",
        r"I used (\w+) to",
        r"Using (\w+) to",
        r"with the help of (\w+)",
        r"tool: (\w+)",
        r"Tool: (\w+)",
        r"\[Executing (\w+)",
        r"I will use (\w+) to"
    ]
    
    # Extract potential tool names
    potential_tools = []
    for pattern in tool_patterns:
        matches = re.findall(pattern, response_content)
        potential_tools.extend(matches)
    
    # Check for specific tool names
    specific_tool_names = {
        "weather": "get_weather",
        "wikipedia": "wikipedia_lookup",
        "web_search": "web_search",
        "news": "latest_news",
        "search_tracks": "search_tracks",
        "play": "play_smart_track",
        "music": "play_smart_track",
        "song": "play_smart_track",
        "track": "play_smart_track",
        "spotify": "play_smart_track",
        "sequential_think": "sequential_think",
        "image": "generate_image",
        "scraping": "scrapingant_page"
    }
    
    # Map potential tools to actual tool functions
    tool_name_to_function = {}
    for tool in ALL_TOOLS:
        tool_name_to_function[tool.name.lower()] = tool
    
    # Execute tools based on extracted information
    for potential_tool in potential_tools:
        tool_name = potential_tool.lower()
        
        # Map common names to actual tool names
        if tool_name in specific_tool_names:
            tool_name = specific_tool_names[tool_name]
        
        # Check if we have this tool
        if tool_name in tool_name_to_function:
            tool_func = tool_name_to_function[tool_name]
            tools_used.append(tool_func.name)
            
            try:
                print(f"🔧 Executing tool: {tool_func.name}")
                
                # Extract parameters for the tool
                # This is a simplified approach - in a real implementation, you'd use more sophisticated parsing
                if tool_func.name == "get_weather":
                    # Extract location from user input or response
                    location_match = re.search(r"weather\s+(?:in|for|at)\s+([A-Za-z\s,]+)", 
                                             user_input + " " + response_content)
                    if location_match:
                        location = location_match.group(1).strip()
                        result = tool_func(location)
                        updated_response += f"\n\n**Weather Tool Result:** {result}"
                
                elif tool_func.name == "wikipedia_lookup":
                    # Extract query from user input or response
                    query_match = re.search(r"(?:about|lookup|search for|find|wikipedia)\s+([A-Za-z\s,]+)", 
                                          user_input + " " + response_content)
                    if query_match:
                        query = query_match.group(1).strip()
                        result = tool_func(query)
                        updated_response += f"\n\n**Wikipedia Result:** {result[:500]}..."
                
                elif tool_func.name == "web_search":
                    # Extract query from user input
                    query_match = re.search(r"(?:search|find|look up)\s+([A-Za-z\s,]+)", 
                                          user_input + " " + response_content)
                    if query_match:
                        query = query_match.group(1).strip()
                        result = tool_func(query)
                        updated_response += f"\n\n**Web Search Result:** {result[:500]}..."
                
                elif tool_func.name == "play_smart_track":
                    # Extract track info from user input
                    track_match = re.search(r"(?:play|song|track|music)\s+([A-Za-z\s,]+)", 
                                          user_input)
                    if track_match:
                        track = track_match.group(1).strip()
                        result = tool_func(track)
                        
                        # Try to extract Spotify track ID from result
                        track_id_match = re.search(r"Track ID: ([a-zA-Z0-9]+)", result)
                        if track_id_match:
                            spotify_track_id = track_id_match.group(1)
                            
                            # Update global variable for Spotify embed
                            from tools import _last_played_track_id
                            global _last_played_track_id
                            _last_played_track_id = spotify_track_id
                            
                        updated_response += f"\n\n**Music Result:** {result}"
                
                elif tool_func.name == "sequential_think":
                    # Use sequential thinking for complex queries
                    result = tool_func(user_input)
                    updated_response += f"\n\n**Thinking Process:** {result[:300]}..."
                
            except Exception as e:
                print(f"❌ Error executing tool {tool_func.name}: {e}")
                updated_response += f"\n\n**Tool Error:** Could not execute {tool_func.name} due to an error."
    
    # Remove duplicates from tools_used
    tools_used = list(set(tools_used))
    
    return tools_used, updated_response, spotify_track_id

def execute_github_ai_model(
    user_input: str,
    thread_id: str,
    model_id: str,
    start_time: float,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """Execute a GitHub AI model with manual tool execution (simplified approach)"""
    if not GITHUB_AI_AVAILABLE:
        return {
            "response": "GitHub AI models are not available.",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": "GitHub AI models not available"
        }
    
    try:
        # Get relevant tools based on user input
        relevant_tools = get_relevant_tools(user_input)
        print(f"Using {len(relevant_tools)} relevant tools for GitHub AI model")
        
        # Analyze user input to determine which tools to use
        user_lower = user_input.lower()
        tools_to_execute = []
        
        # Determine tools needed based on user input
        if "weather" in user_lower:
            # Extract location
            location_match = re.search(r"weather.*?(?:in|at|for)\s+([a-zA-Z\s]+?)(?:\s+and|\s+then|$)", user_input, re.IGNORECASE)
            if location_match:
                location = location_match.group(1).strip()
                tools_to_execute.append(("get_weather", location))
        
        if any(keyword in user_lower for keyword in ["play", "change song", "change the song"]):
            # Extract song name
            song_match = re.search(r"(?:play|change.*?song.*?to|put on)\s+(.+?)(?:\s+and|\s+then|$)", user_input, re.IGNORECASE)
            if song_match:
                song = song_match.group(1).strip()
                tools_to_execute.append(("play_smart_track", song))
        
        if any(keyword in user_lower for keyword in ["volume"]):
            # Extract volume level
            volume_match = re.search(r"volume.*?(\d+)", user_input)
            if volume_match:
                volume = int(volume_match.group(1))
                tools_to_execute.append(("set_volume", volume))
        
        if any(keyword in user_lower for keyword in ["essay", "write", "information", "wikipedia"]):
            # Extract topic
            topic_match = re.search(r"(?:about|essay.*?about|write.*?about|information.*?about)\s+(.+?)(?:\s+using|\s+and|\s+then|$)", user_input, re.IGNORECASE)
            if topic_match:
                topic = topic_match.group(1).strip()
                tools_to_execute.append(("wikipedia_lookup", topic))
        
        # Check for sequential thinking keywords
        if any(keyword in user_lower for keyword in ["step by step", "sequential", "think", "reasoning", "process", "analyze", "break down"]):
            tools_to_execute.append(("sequential_think", user_input))
        
        # Execute tools in sequence
        tools_used = []
        tool_results = []
        spotify_track_id = None
        
        for tool_name, tool_input in tools_to_execute:
            # Find the tool
            tool_func = None
            for tool in relevant_tools:
                if tool.name == tool_name:
                    tool_func = tool
                    break
            
            if tool_func:
                try:
                    print(f"🔧 Executing tool: {tool_name} with input: {tool_input}")
                    
                    # Handle special parameter conversion
                    if tool_name == "set_volume" and isinstance(tool_input, str):
                        tool_input = int(re.search(r'(\d+)', tool_input).group(1))
                    
                    # Use invoke method to avoid deprecation warning
                    if tool_name == "sequential_think":
                        if hasattr(tool_func, 'invoke'):
                            result = tool_func.invoke({
                                "thought": tool_input, 
                                "session_id": thread_id,
                                "branch_from": "None",
                                "operation": "append"
                            })
                        else:
                            result = tool_func(tool_input, thread_id)
                    elif tool_name == "set_volume":
                        if hasattr(tool_func, 'invoke'):
                            result = tool_func.invoke({"volume": tool_input})
                        else:
                            result = tool_func(tool_input)
                    else:
                        if hasattr(tool_func, 'invoke'):
                            result = tool_func.invoke({"query": tool_input} if tool_name in ["wikipedia_lookup", "web_search"] else {"location": tool_input} if tool_name == "get_weather" else {"track": tool_input})
                        else:
                            result = tool_func(tool_input)
                    tools_used.append(tool_name)
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result
                    })
                    
                    # Handle Spotify integration
                    if tool_name == "play_smart_track":
                        try:
                            from tools import get_last_played_track_id, clear_last_played_track_id
                            spotify_track_id = get_last_played_track_id()
                            if spotify_track_id:
                                print(f"🎵 GitHub AI - Retrieved Track ID: {spotify_track_id}")
                                clear_last_played_track_id()
                        except ImportError:
                            pass
                    
                except Exception as e:
                    print(f"❌ Error executing tool {tool_name}: {e}")
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": f"Error: {str(e)}"
                    })
        
        # Create comprehensive response using GitHub AI model
        if tool_results:
            # Build context with tool results
            context = "Here are the results from the tools I used:\n\n"
            for result in tool_results:
                context += f"**{result['tool']}**: {result['result']}\n\n"
            
            # Ask GitHub AI to create a comprehensive response
            prompt = f"Based on the user's request: '{user_input}'\n\n{context}\nPlease provide a comprehensive response that addresses all parts of the user's request."
            
            ai_result = github_ai_complete(prompt, model_id, "You are a helpful AI assistant. Provide comprehensive responses based on the tool results provided.")
            
            if "error" in ai_result:
                response_text = f"I completed the requested tasks:\n\n{context}"
            else:
                response_text = ai_result["content"]
        else:
            # No tools executed, use GitHub AI directly
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
            "model_type": "github_ai_with_tools"
        }
        
        if spotify_track_id:
            final_response["spotify_track_id"] = spotify_track_id
        
        return final_response
        
    except Exception as e:
        return {
            "response": f"Error with GitHub AI model: {str(e)}",
            "tools_used": [],
            "execution_time": time.time() - start_time,
            "model_used": model_id,
            "error": str(e)
        }

def _extract_tool_info_github(messages: List) -> tuple[List[str], Optional[str]]:
    """Extract tool usage information and Spotify track ID (same as Ollama)"""
    tools_used = []
    spotify_track_id = None
    
    for msg in messages:
        if isinstance(msg, AIMessage) and hasattr(msg, 'tool_calls') and msg.tool_calls:
            for tool_call in msg.tool_calls:
                tool_name = tool_call.get("name")
                if tool_name:
                    tools_used.append(tool_name)
    
    # Handle Spotify integration (same as Ollama)
    spotify_tools = ['play_smart_track', 'current_track', 'play', 'music', 'song', 'track']
    if any(tool in spotify_tools for tool in tools_used):
        print(f"🎵 GitHub AI - Spotify tool detected in: {tools_used}")
        
        # Method 1: Get track ID from global variable (most reliable)
        try:
            from tools import get_last_played_track_id, clear_last_played_track_id
            spotify_track_id = get_last_played_track_id()
            print(f"🎵 GitHub AI - Retrieved Track ID from global: {spotify_track_id}")
            
            if spotify_track_id:
                # Only clear after we've successfully retrieved it
                clear_last_played_track_id()
                print(f"🎵 GitHub AI - Cleared global track ID after retrieval")
            else:
                print(f"🎵 GitHub AI - No track ID found in global variable")
        except ImportError:
            print(f"🎵 GitHub AI - Error importing track ID functions")
    
    return tools_used, spotify_track_id

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