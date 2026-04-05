#!/bin/bash
# Run E2E tests with a live server
cd "$(dirname "$0")"

export PORT=3199

echo "Starting server on port $PORT..."
node dist/index.js &
SERVER_PID=$!

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:$PORT/api/v1/loggedin 2>/dev/null; then
    echo "Server ready!"
    break
  fi
  sleep 1
done

echo "Running E2E tests..."
node e2e-test.mjs
TEST_EXIT=$?

echo "Stopping server (PID $SERVER_PID)..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

exit $TEST_EXIT
