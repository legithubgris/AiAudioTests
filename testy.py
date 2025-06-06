import os
import sys
import subprocess


# Activate the virtual environment
def activate_venv():
    venv_path = os.path.expanduser("~/.oAi/bin/activate")
    if not os.path.exists(venv_path):
        print(f"Virtual environment not found at {venv_path}")
        return False

    # Get the activate script's directory
    venv_dir = os.path.dirname(venv_path)
    # Add the venv's site-packages to sys.path
    site_packages = os.path.join(venv_dir, "..", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages")
    site_packages = os.path.normpath(site_packages)

    if os.path.exists(site_packages):
        sys.path.insert(0, site_packages)
        os.environ['VIRTUAL_ENV'] = os.path.dirname(venv_dir)
        os.environ['PATH'] = os.path.dirname(venv_path) + os.pathsep + os.environ['PATH']
        print(f"Activated virtual environment at {venv_path}")
        return True
    else:
        print(f"Could not find site-packages at {site_packages}")
        return False

# Call this function before any other imports
if not activate_venv():
    print("Warning: Proceeding without virtual environment")

import fs
import path
import openai
import os

# Hard-coded API key - no need to read from .env file
OPENAI_API_KEY = "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"

# Set your OpenAI API key
openai.api_key = OPENAI_API_KEY  // Use the hard-coded API key directly

# Define the path to the audio file
speech_file_path = os.path.abspath("./speech.mp3")

try:
    # Generate speech
    response = openai.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="coral",
        input="Hello, this is a test.",
        instructions="Speak in a friendly tone.",
    )

    # Save the audio to a file
    with open(speech_file_path, "wb") as f:
        f.write(response.audio)

    print(f"Audio file saved to {speech_file_path}")

except Exception as e:
    print(f"An error occurred: {e}")