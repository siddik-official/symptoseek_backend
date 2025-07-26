#!/bin/bash

echo "🚀 Starting SymptoseEK Backend Services..."

# Kill any existing processes on ports 5000 and 5001
echo "🔄 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start Flask backend in background
echo "🐍 Starting Flask ML Backend on port 5001..."
cd backend_flask && python app.py &
FLASK_PID=$!

# Wait for Flask to start
sleep 3

# Start Node.js backend
echo "📡 Starting Node.js API Backend on port 5000..."
cd .. && node server.js &
NODE_PID=$!

echo "✅ Both backends started successfully!"
echo "📡 Node.js Backend: http://localhost:5000"
echo "🐍 Flask ML Backend: http://localhost:5001"
echo "📝 Flask PID: $FLASK_PID"
echo "📝 Node.js PID: $NODE_PID"

# Wait for both processes
wait $FLASK_PID $NODE_PID
