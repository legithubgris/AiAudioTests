#!/bin/bash
# Script to run npm start, capture output, and feed it to GitHub Copilot for analysis

echo "Starting TTS Website with npm start and monitoring for errors/warnings..."

while true; do
  # Create a temporary file to store npm start output
  OUTPUT_FILE=$(mktemp)
  
  # Run npm start and capture all output (including stderr)
  npm start 2>&1 | tee "$OUTPUT_FILE" &
  NPM_PID=$!
  
  # Sleep for a bit to let the server start up
  sleep 5
  
  # Check if there are any warnings or errors in the output
  if grep -E "WARNING|ERROR|Error:" "$OUTPUT_FILE" > /dev/null; then
    echo "Found warnings or errors. Copying to clipboard for GitHub Copilot..."
    
    # Extract warnings and errors and put them in a formatted message
    ERROR_MESSAGE="I ran npm start and got these warnings/errors. Please fix them:\n\n"
    ERROR_MESSAGE+="$(grep -A 5 -B 2 -E "WARNING|ERROR|Error:" "$OUTPUT_FILE")"
    
    # Copy to clipboard (works on macOS)
    echo -e "$ERROR_MESSAGE" | pbcopy
    
    echo "Warnings/errors copied to clipboard. Please paste them to GitHub Copilot."
    echo "After GitHub Copilot suggests fixes, apply them and then press Enter to restart npm start."
    read -p "Press Enter to restart after applying fixes, or Ctrl+C to exit: " INPUT
    
    # Kill the npm start process before restarting
    kill $NPM_PID 2>/dev/null
    wait $NPM_PID 2>/dev/null
  else
    echo "No warnings or errors found! App is running cleanly."
    break
  fi
  
  # Cleanup temp file
  rm -f "$OUTPUT_FILE"
done

echo "App is running. Press Ctrl+C to stop."

# Wait for npm start to finish (it won't unless interrupted)
wait $NPM_PID
