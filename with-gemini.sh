#!/bin/bash

# Default to running the test script if no command is provided
CMD="${@:-./test.sh}"

# Check for API Key
if [ -z "$NEXT_PUBLIC_GEMINI_API_KEY" ]; then
  echo "----------------------------------------------------------------"
  echo "Gemini API Key is required."
  echo "Please enter your Gemini API Key (input will be hidden):"
  read -s NEXT_PUBLIC_GEMINI_API_KEY
  export NEXT_PUBLIC_GEMINI_API_KEY
else
  echo "Using existing NEXT_PUBLIC_GEMINI_API_KEY from environment."
fi

# Check for Model
if [ -z "$NEXT_PUBLIC_GEMINI_MODEL" ]; then
  echo "Please enter the Gemini Model (default: gemini-3-flash-preview):"
  read NEXT_PUBLIC_GEMINI_MODEL
  export NEXT_PUBLIC_GEMINI_MODEL="${NEXT_PUBLIC_GEMINI_MODEL:-gemini-3-flash-preview}"
  echo "Using model: $NEXT_PUBLIC_GEMINI_MODEL"
else
  echo "Using existing NEXT_PUBLIC_GEMINI_MODEL from environment: $NEXT_PUBLIC_GEMINI_MODEL"
fi
echo "----------------------------------------------------------------"

# Execute the command
echo "Executing: $CMD"
eval "$CMD"