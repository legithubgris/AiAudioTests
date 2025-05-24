#!/bin/bash
# Script to apply a fix to a file based on GitHub Copilot suggestions

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <file_path> <fix_description>"
  echo "Example: $0 src/App.js 'Fix ESLint warnings by extracting processRow function'"
  exit 1
fi

FILE_PATH=$1
FIX_DESCRIPTION=$2

echo "Applying fix: $FIX_DESCRIPTION to file: $FILE_PATH"
echo "Please paste the GitHub Copilot's fix code below."
echo "When you're done, press Ctrl+D to save:"

# Read the fix code from standard input until EOF (Ctrl+D)
FIX_CODE=$(cat)

# Create a backup of the original file
cp "$FILE_PATH" "${FILE_PATH}.bak"

# Apply the fix
echo "$FIX_CODE" > "$FILE_PATH"

echo "Fix applied! Original file saved as ${FILE_PATH}.bak"
echo "Running npm start to check if the fix worked..."

# Run npm start again to check if the fix worked
cd "$(dirname "$FILE_PATH")" && cd .. && npm start
