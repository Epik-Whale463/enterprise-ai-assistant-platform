"""
Test script for GitHub AI models integration
"""
import os
from dotenv import load_dotenv
from github_ai_models import github_ai_complete, get_available_models

# Load environment variables
load_dotenv()

def test_github_ai_models():
    """Test GitHub AI models integration"""
    print("Testing GitHub AI models integration...")
    
    # Debug environment variables
    print("\nChecking GitHub tokens:")
    github_token = os.environ.get("GITHUB_TOKEN")
    github_token2 = os.environ.get("GITHUB_TOKEN2")
    
    if github_token:
        print(f"✅ GITHUB_TOKEN found: {github_token[:5]}...{github_token[-5:]}")
    else:
        print("❌ GITHUB_TOKEN not found in environment")
    
    if github_token2:
        print(f"✅ GITHUB_TOKEN2 found: {github_token2[:5]}...{github_token2[-5:]}")
    else:
        print("❌ GITHUB_TOKEN2 not found in environment")
    
    # Get available models
    print("\nAvailable GitHub AI models:")
    models = get_available_models()
    print(f"Found {len(models)} models")
    for model in models:
        print(f"- {model['id']} ({model['name']}): {model['description']}")
    
    # Test a simple completion
    model_id = "github-xai-grok-3-mini"
    user_input = "What is the capital of France?"
    
    print(f"\nTesting completion with {model_id}...")
    result = github_ai_complete(user_input, model_id)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Response: {result['content']}")

if __name__ == "__main__":
    test_github_ai_models()