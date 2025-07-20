#!/bin/sh
# Wait for Ollama to be fully ready
echo "Waiting for Ollama service to be fully ready..."
sleep 5

# Pull required models
echo "Pulling Qwen2.5 model..."
curl -X POST http://ollama:11434/api/pull -d "{\"name\":\"qwen2.5\"}"

echo "Ollama setup completed successfully"