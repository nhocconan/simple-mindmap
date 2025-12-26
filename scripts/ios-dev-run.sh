#!/bin/bash

# iOS Development Build and Run Script
# This script configures the iOS app with local development environment and runs it in simulator

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Use full paths for Xcode tools
XCODEBUILD="/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild"
SIMCTL="/Applications/Xcode.app/Contents/Developer/usr/bin/simctl"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mindmap iOS Development Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Xcode is installed
if [ ! -f "$XCODEBUILD" ]; then
    echo -e "${RED}Error: Xcode is not installed at /Applications/Xcode.app${NC}"
    echo "Please install Xcode from the App Store"
    exit 1
fi

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_PROJECT_DIR="$PROJECT_ROOT/ios/MindmapApp"
XCODE_PROJECT="$IOS_PROJECT_DIR/MindmapApp.xcodeproj"
API_SERVICE_FILE="$IOS_PROJECT_DIR/MindmapApp/Services/APIService.swift"
ENV_FILE="$PROJECT_ROOT/.env"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    exit 1
fi

# Read backend URL from .env
BACKEND_URL=$(grep NEXT_PUBLIC_API_URL "$ENV_FILE" | cut -d '=' -f2)
if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="http://localhost:4000"
fi

# Convert localhost to 127.0.0.1 for iOS Simulator compatibility
BACKEND_URL=${BACKEND_URL//localhost/127.0.0.1}

echo -e "${GREEN}✓${NC} Found backend URL: ${BLUE}$BACKEND_URL${NC}"

# Extract API URL (add /api if not present)
API_BASE_URL="${BACKEND_URL}/api"
if [[ "$BACKEND_URL" == *"/api" ]]; then
    API_BASE_URL="$BACKEND_URL"
fi

echo -e "${GREEN}✓${NC} API URL for iOS: ${BLUE}$API_BASE_URL${NC}"
echo ""

# Configure APIService.swift with backend URL
echo -e "${YELLOW}Configuring APIService.swift...${NC}"

# Backup original file
cp "$API_SERVICE_FILE" "$API_SERVICE_FILE.backup"

# Update the baseURL in APIService.swift
sed -i '' "s|return \".*\"|return \"$API_BASE_URL\"|" "$API_SERVICE_FILE"

echo -e "${GREEN}✓${NC} APIService.swift configured"
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
if curl -s -f "${BACKEND_URL}/api/auth/me" >/dev/null 2>&1 || curl -s "${BACKEND_URL}/api/auth/me" 2>&1 | grep -q "Unauthorized"; then
    echo -e "${GREEN}✓${NC} Backend is reachable"
else
    echo -e "${YELLOW}⚠${NC}  Backend may not be running"
    echo -e "   Start with: ${BLUE}cd backend && npm run start:dev${NC}"
    echo ""
fi

# List available simulators
echo -e "${YELLOW}Checking iOS Simulators...${NC}"
SIMULATORS=$("$SIMCTL" list devices available 2>/dev/null | grep -E "iPhone.*\(" | head -10)
if [ -z "$SIMULATORS" ]; then
    echo -e "${RED}No simulators found${NC}"
    echo "Install via: Xcode > Settings > Platforms"
    exit 1
fi

echo "$SIMULATORS" | nl -w2 -s'. '
echo ""

# Select first iPhone simulator
DEFAULT_SIMULATOR=$(echo "$SIMULATORS" | head -1 | sed -E 's/.*\(([A-Z0-9-]+)\).*/\1/')
SIMULATOR_NAME=$(echo "$SIMULATORS" | head -1 | sed -E 's/^[[:space:]]*(iPhone[^(]*).*/\1/' | xargs)
echo -e "Selected: ${GREEN}$SIMULATOR_NAME${NC}"
echo -e "UUID: ${BLUE}$DEFAULT_SIMULATOR${NC}"
echo ""

# Clean build
echo -e "${YELLOW}Cleaning build folder...${NC}"
cd "$IOS_PROJECT_DIR"
"$XCODEBUILD" clean -project MindmapApp.xcodeproj -scheme MindmapApp >/dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Clean complete"
echo ""

# Build
echo -e "${YELLOW}Building iOS app...${NC}"
echo -e "${BLUE}This may take 5-10 minutes on first build...${NC}"
echo ""

"$XCODEBUILD" \
    -project MindmapApp.xcodeproj \
    -scheme MindmapApp \
    -sdk iphonesimulator \
    -destination "platform=iOS Simulator,id=$DEFAULT_SIMULATOR" \
    -configuration Debug \
    build 2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|Compiling|Linking"

BUILD_STATUS=${PIPESTATUS[0]}

if [ $BUILD_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Build successful!"
    echo ""
    
    # Install and launch
    echo -e "${YELLOW}Installing app on simulator...${NC}"
    
    # Find the built app - exclude Index paths
    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -path "*/Build/Products/Debug-iphonesimulator/MindmapApp.app" -type d 2>/dev/null | grep -v Index | head -1)
    
    if [ -z "$APP_PATH" ]; then
        echo -e "${YELLOW}Searching in alternate location...${NC}"
        APP_PATH=$(find "$IOS_PROJECT_DIR/build" -name "MindmapApp.app" -type d 2>/dev/null | head -1)
    fi
    
    if [ -n "$APP_PATH" ]; then
        echo -e "${GREEN}✓${NC} Found app at: $APP_PATH"
        echo ""
        
        # Boot simulator if not running
        echo -e "${YELLOW}Starting simulator...${NC}"
        "$SIMCTL" boot "$DEFAULT_SIMULATOR" 2>/dev/null || echo "Simulator already running"
        sleep 2
        
        # Open Simulator app
        open -a Simulator 2>/dev/null || true
        sleep 3
        
        # Install app
        echo -e "${YELLOW}Installing app...${NC}"
        "$SIMCTL" install "$DEFAULT_SIMULATOR" "$APP_PATH"
        
        # Launch app
        echo -e "${YELLOW}Launching app...${NC}"
        BUNDLE_ID="com.mindmap.app"
        "$SIMCTL" launch "$DEFAULT_SIMULATOR" "$BUNDLE_ID"
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ App launched successfully!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "Configuration:"
        echo -e "  API URL: ${BLUE}$API_BASE_URL${NC}"
        echo -e "  Simulator: ${BLUE}$SIMULATOR_NAME${NC}"
        echo -e "  Bundle ID: ${BLUE}$BUNDLE_ID${NC}"
        echo ""
        echo -e "${YELLOW}Default Login Credentials:${NC}"
        echo -e "  Email: ${BLUE}admin@mindmap.app${NC}"
        echo -e "  Password: ${BLUE}Admin@123!${NC}"
        echo ""
        echo -e "${YELLOW}What to do next:${NC}"
        echo "  1. Simulator window should be open"
        echo "  2. Mindmap app should launch automatically"
        echo "  3. Login with the credentials above"
        echo "  4. Start creating mindmaps!"
        echo ""
        echo -e "${YELLOW}Useful Commands:${NC}"
        echo "  • View app logs:"
        echo "    ${BLUE}$SIMCTL spawn $DEFAULT_SIMULATOR log stream --predicate 'process == \"MindmapApp\"'${NC}"
        echo "  • Relaunch app:"
        echo "    ${BLUE}$SIMCTL launch $DEFAULT_SIMULATOR $BUNDLE_ID${NC}"
        echo "  • Uninstall app:"
        echo "    ${BLUE}$SIMCTL uninstall $DEFAULT_SIMULATOR $BUNDLE_ID${NC}"
        echo ""
    else
        echo -e "${RED}Error: Could not find built app${NC}"
        echo "Build may have failed. Check the build output above."
        exit 1
    fi
else
    echo ""
    echo -e "${RED}Build failed. Check errors above.${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "  • Check Xcode is properly installed"
    echo "  • Open project in Xcode and fix any signing issues"
    echo "  • Try building in Xcode first: ${BLUE}open $XCODE_PROJECT${NC}"
    exit 1
fi
