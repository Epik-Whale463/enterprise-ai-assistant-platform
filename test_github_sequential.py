#!/usr/bin/env python3
"""
Test GitHub AI models with sequential thinking
"""

def test_github_sequential():
    """Test GitHub AI models with sequential thinking"""
    print("🧪 Testing GitHub AI with Sequential Thinking...")
    
    try:
        # Test GitHub AI integration
        from ai_core_github_integration import execute_github_ai_model
        import time
        
        # Test a simple query that should trigger sequential thinking
        user_input = "Think step by step about how to solve 2+2*3. Use sequential thinking to show your reasoning process."
        thread_id = "test_github_sequential"
        model_id = "github-openai-gpt-4.1-mini"
        start_time = time.time()
        
        print(f"🤖 Testing with model: {model_id}")
        print(f"📝 Input: {user_input}")
        
        result = execute_github_ai_model(
            user_input=user_input,
            thread_id=thread_id,
            model_id=model_id,
            start_time=start_time
        )
        
        print(f"✅ Response: {result['response'][:200]}...")
        print(f"🔧 Tools used: {result.get('tools_used', [])}")
        print(f"⏱️ Execution time: {result.get('execution_time', 0):.2f}s")
        
        # Check if sequential thinking was used
        if 'sequential_think' in result.get('tools_used', []):
            print("🧠 Sequential thinking was used!")
        else:
            print("⚠️ Sequential thinking was not detected")
        
        print("✅ GitHub AI with sequential thinking test completed!")
        
    except Exception as e:
        print(f"❌ Error testing GitHub AI with sequential thinking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_github_sequential()