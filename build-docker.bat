@echo off
echo 🐳 Building AI Assistant Docker Image...
echo This will include your entire project folder, including .env file

REM Copy the fullstack dockerignore
copy .dockerignore.fullstack .dockerignore

REM Build the Docker image
docker build -f Dockerfile.simple -t ai-assistant:latest .

REM Restore original dockerignore (if it exists)
if exist .dockerignore.original (
    copy .dockerignore.original .dockerignore
)

echo ✅ Docker image built successfully!
echo 🚀 To run: docker-compose -f docker-compose.simple.yml up