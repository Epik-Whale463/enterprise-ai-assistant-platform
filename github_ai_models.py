"""
GitHub AI Models Integration - Provides access to GitHub AI models via Azure AI Inference SDK
"""
import os
import time
import threading
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Import Azure AI Inference SDK
try:
    from azure.ai.inference import ChatCompletionsClient
    from azure.ai.inference.models import SystemMessage, UserMessage, ToolMessage
    from azure.core.credentials import AzureKeyCredential
    AZURE_SDK_AVAILABLE = True
except ImportError:
    print("⚠️ Azure AI Inference SDK not available. GitHub AI models will not work.")
    AZURE_SDK_AVAILABLE = False

# GitHub AI Models Configuration
GITHUB_AI_ENDPOINT = "https://models.github.ai/inference"
GITHUB_TOKENS = [
    os.environ.get("GITHUB_TOKEN", ""),
    os.environ.get("GITHUB_TOKEN2", "")
]

# Debug output to verify tokens
if GITHUB_TOKENS[0]:
    print(f"✅ GitHub Token 1 loaded: {GITHUB_TOKENS[0][:5]}...{GITHUB_TOKENS[0][-5:]} (length: {len(GITHUB_TOKENS[0])})")
else:
    print("❌ GitHub Token 1 not found in environment")
    
if GITHUB_TOKENS[1]:
    print(f"✅ GitHub Token 2 loaded: {GITHUB_TOKENS[1][:5]}...{GITHUB_TOKENS[1][-5:]} (length: {len(GITHUB_TOKENS[1])})")
else:
    print("❌ GitHub Token 2 not found in environment")

# Available GitHub AI Models
GITHUB_AI_MODELS = {
    "github-xai-grok-3-mini": {
        "model_id": "xai/grok-3-mini",
        "description": "Smaller version of Grok-3 with tool use capabilities",
        "context_window": 8192,
        "strengths": ["reasoning", "coding", "tool use"],
        "system_prompt": "You are a helpful AI assistant with advanced tool-using capabilities. You have access to various tools including weather, web search, Wikipedia, news, music playback, and more. Always use the most appropriate tool to answer user queries and clearly mention which tool you're using in your response."
    },
    "github-openai-gpt-4.1": {
        "model_id": "openai/gpt-4.1",
        "description": "OpenAI's GPT-4.1 model with tool use capabilities",
        "context_window": 128000,
        "strengths": ["reasoning", "coding", "tool use", "general knowledge"],
        "system_prompt": "You are a helpful AI assistant with advanced tool-using capabilities. You have access to various tools including weather, web search, Wikipedia, news, music playback, and more. Always use the most appropriate tool to answer user queries and clearly mention which tool you're using in your response."
    },
    "github-openai-gpt-4.1-nano": {
        "model_id": "openai/gpt-4.1-nano",
        "description": "Smallest version of GPT-4.1 with tool use capabilities",
        "context_window": 128000,
        "strengths": ["reasoning", "coding", "tool use"],
        "system_prompt": "You are a helpful AI assistant with advanced tool-using capabilities. You have access to various tools including weather, web search, Wikipedia, news, music playback, and more. Always use the most appropriate tool to answer user queries and clearly mention which tool you're using in your response."
    },
    "github-xai-grok-3": {
        "model_id": "xai/grok-3",
        "description": "Full version of Grok-3 with tool use capabilities",
        "context_window": 8192,
        "strengths": ["reasoning", "coding", "tool use", "general knowledge"],
        "system_prompt": "You are a helpful AI assistant with advanced tool-using capabilities. You have access to various tools including weather, web search, Wikipedia, news, music playback, and more. Always use the most appropriate tool to answer user queries and clearly mention which tool you're using in your response."
    },
    "github-openai-gpt-4.1-mini": {
        "model_id": "openai/gpt-4.1-mini",
        "description": "Mini version of GPT-4.1 with tool use capabilities",
        "context_window": 128000,
        "strengths": ["reasoning", "coding", "tool use"],
        "system_prompt": "You are a helpful AI assistant with advanced tool-using capabilities. You have access to various tools including weather, web search, Wikipedia, news, music playback, and more. Always use the most appropriate tool to answer user queries and clearly mention which tool you're using in your response."
    }
}

class GitHubAITokenManager:
    """Manages GitHub API tokens with rate limiting awareness"""
    
    def __init__(self, tokens: List[str]):
        # Filter out empty or invalid tokens (GitHub tokens should be 40 chars)
        self.tokens = [token for token in tokens if token and len(token) >= 30]
        self.current_index = 0
        self.token_usage = {token: {"last_used": 0, "count": 0} for token in self.tokens}
        self._lock = threading.RLock()
        
        if not self.tokens:
            print("⚠️ No valid GitHub tokens provided. GitHub AI models will not work.")
            print("Please check your .env file and ensure GITHUB_TOKEN and GITHUB_TOKEN2 are set correctly.")
            print(f"Found tokens: {tokens}")
        else:
            print(f"✅ Found {len(self.tokens)} valid GitHub tokens for AI models")
    
    def get_token(self) -> Optional[str]:
        """Get the next available token with rate limiting awareness"""
        if not self.tokens:
            return None
            
        with self._lock:
            # Simple round-robin for now
            token = self.tokens[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.tokens)
            
            # Update usage stats
            self.token_usage[token]["last_used"] = time.time()
            self.token_usage[token]["count"] += 1
            
            return token

# Initialize token manager
token_manager = GitHubAITokenManager(GITHUB_TOKENS)

class GitHubAIClient:
    """Client for GitHub AI models using Azure AI Inference SDK"""
    
    def __init__(self):
        self.clients = {}
        self._lock = threading.RLock()
    
    def get_client(self) -> Optional[ChatCompletionsClient]:
        """Get or create a client with the current token"""
        if not AZURE_SDK_AVAILABLE:
            print("❌ Azure SDK not available - please install azure-ai-inference package")
            return None
            
        token = token_manager.get_token()
        if not token:
            print("❌ No valid GitHub token available")
            return None
            
        # Validate token format (GitHub tokens are 40 chars)
        if len(token) < 30:
            print(f"❌ GitHub token appears invalid (length: {len(token)})")
            return None
            
        with self._lock:
            if token not in self.clients:
                try:
                    print(f"Creating new GitHub AI client with token: {token[:5]}...{token[-5:]}")
                    self.clients[token] = ChatCompletionsClient(
                        endpoint=GITHUB_AI_ENDPOINT,
                        credential=AzureKeyCredential(token)
                    )
                    print("✅ Successfully created GitHub AI client")
                except Exception as e:
                    print(f"❌ Error creating GitHub AI client: {e}")
                    return None
            
            return self.clients[token]
    
    def complete(self, messages: List[Dict[str, str]], model_id: str, temperature: float = 0.7) -> Optional[Dict]:
        """Complete a conversation using GitHub AI models"""
        client = self.get_client()
        if not client:
            return {
                "error": "GitHub AI client not available. Check your tokens and Azure SDK installation."
            }
        
        try:
            # Convert messages to Azure SDK format
            azure_messages = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                if role == "system":
                    azure_messages.append(SystemMessage(content))
                elif role == "user":
                    azure_messages.append(UserMessage(content))
                elif role == "assistant":
                    # This is simplified - in a real implementation you'd handle tool calls
                    azure_messages.append(ToolMessage(content=content, tool_call_id="none"))
            
            # Make the API call
            response = client.complete(
                messages=azure_messages,
                temperature=temperature,
                top_p=1.0,
                model=model_id
            )
            
            # Extract and return the response
            return {
                "content": response.choices[0].message.content,
                "model": model_id
            }
            
        except Exception as e:
            return {
                "error": f"Error calling GitHub AI model: {str(e)}"
            }

# Initialize GitHub AI client
github_ai_client = GitHubAIClient()

def get_available_models() -> List[Dict]:
    """Get list of available GitHub AI models"""
    models = []
    for model_id, config in GITHUB_AI_MODELS.items():
        models.append({
            "id": model_id,
            "name": config["model_id"],
            "description": config["description"],
            "context_window": config["context_window"],
            "strengths": config["strengths"]
        })
    return models

def github_ai_complete(user_input: str, model_id: str, system_prompt: Optional[str] = None) -> Dict:
    """Complete a conversation using GitHub AI models with tool support"""
    # Get the actual model ID from our config
    if model_id in GITHUB_AI_MODELS:
        actual_model_id = GITHUB_AI_MODELS[model_id]["model_id"]
        if not system_prompt:
            system_prompt = GITHUB_AI_MODELS[model_id]["system_prompt"]
    else:
        return {
            "error": f"Unknown model ID: {model_id}"
        }
    
    # Enhance system prompt with tool instructions
    if system_prompt and "tool" not in system_prompt.lower():
        system_prompt += "\n\nYou have access to various tools. When appropriate, use these tools to provide better answers. Always mention which tool you're using in your response."
    
    # Create messages
    messages = []
    
    # Add system prompt if provided
    if system_prompt:
        messages.append({
            "role": "system",
            "content": system_prompt
        })
    
    # Add user message
    messages.append({
        "role": "user",
        "content": user_input
    })
    
    # Call the GitHub AI client
    return github_ai_client.complete(messages, actual_model_id)