#!/bin/bash

# Package Chrome extension files into a zip archive

ZIP_NAME="extension.zip"

# Remove existing zip if it exists
rm -f "$ZIP_NAME"

# Create zip with only the necessary files
zip "$ZIP_NAME" \
    manifest.json \
    background.js \
    icon48.png \
    icon128.png

echo "Created $ZIP_NAME"
