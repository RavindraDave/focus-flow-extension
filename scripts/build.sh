#!/bin/bash

# Focus Flow Build Management Script

echo "=================================="
echo "   Focus Flow Build Manager"
echo "=================================="
echo ""
echo "Select build mode:"
echo "1) Production (Default) - Excludes premium features (YouTube), compliant for Web Store"
echo "2) Development - Includes all features (YouTube), for testing and dev"
echo ""
read -p "Enter choice [1]: " choice

# Default to 1 if empty
choice=${choice:-1}

if [ "$choice" == "1" ]; then
    echo ""
    echo ">> Building for PRODUCTION..."
    echo "   (Excluding YouTube content script, Minified, No Sourcemaps)"
    echo ""
    npm run build
elif [ "$choice" == "2" ]; then
    echo ""
    echo ">> Building for DEVELOPMENT..."
    echo "   (Including YouTube content script, Sourcemaps enabled)"
    echo ""
    npm run build -- --mode development
else
    echo "Invalid selection. Defaulting to Production."
    npm run build
fi

echo ""
echo "Build complete."
