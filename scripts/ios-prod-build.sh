#!/bin/bash

# iOS Production Build Script
# This script helps build and archive iOS app for TestFlight/App Store distribution

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mindmap iOS Production Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}Error: Xcode is not installed${NC}"
    exit 1
fi

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_PROJECT_DIR="$PROJECT_ROOT/ios/MindmapApp"
XCODE_PROJECT="$IOS_PROJECT_DIR/MindmapApp.xcodeproj"
API_SERVICE_FILE="$IOS_PROJECT_DIR/MindmapApp/Services/APIService.swift"

echo -e "${YELLOW}This script will help you build the iOS app for production${NC}"
echo ""

# Gather information
echo -e "${BLUE}Configuration${NC}"
echo -e "${BLUE}─────────────${NC}"
echo ""

# 1. Production API URL
read -p "$(echo -e ${YELLOW}"Enter production API URL (e.g., https://api.mindmap.app):"${NC} )" PROD_API_URL
if [ -z "$PROD_API_URL" ]; then
    echo -e "${RED}Error: API URL is required${NC}"
    exit 1
fi

# Add /api if not present
if [[ "$PROD_API_URL" != *"/api" ]]; then
    PROD_API_URL="${PROD_API_URL}/api"
fi

echo -e "${GREEN}✓${NC} API URL: ${BLUE}$PROD_API_URL${NC}"
echo ""

# 2. Bundle Identifier
read -p "$(echo -e ${YELLOW}"Enter Bundle Identifier (e.g., com.yourcompany.mindmap):"${NC} )" BUNDLE_ID
if [ -z "$BUNDLE_ID" ]; then
    BUNDLE_ID="com.mindmap.app"
    echo -e "Using default: ${BLUE}$BUNDLE_ID${NC}"
fi
echo ""

# 3. App Display Name
read -p "$(echo -e ${YELLOW}"Enter App Display Name (default: Mindmap):"${NC} )" APP_NAME
if [ -z "$APP_NAME" ]; then
    APP_NAME="Mindmap"
fi
echo -e "${GREEN}✓${NC} App Name: ${BLUE}$APP_NAME${NC}"
echo ""

# 4. Version
read -p "$(echo -e ${YELLOW}"Enter App Version (default: 1.0.0):"${NC} )" APP_VERSION
if [ -z "$APP_VERSION" ]; then
    APP_VERSION="1.0.0"
fi
echo -e "${GREEN}✓${NC} Version: ${BLUE}$APP_VERSION${NC}"
echo ""

# 5. Build Number
read -p "$(echo -e ${YELLOW}"Enter Build Number (default: 1):"${NC} )" BUILD_NUMBER
if [ -z "$BUILD_NUMBER" ]; then
    BUILD_NUMBER="1"
fi
echo -e "${GREEN}✓${NC} Build: ${BLUE}$BUILD_NUMBER${NC}"
echo ""

# 6. Team ID (for code signing)
echo -e "${YELLOW}Code Signing Setup${NC}"
echo "To find your Team ID:"
echo "  1. Open Xcode"
echo "  2. Xcode > Settings > Accounts"
echo "  3. Select your Apple ID > View team details"
echo "  4. Copy the Team ID (10 characters)"
echo ""
read -p "$(echo -e ${YELLOW}"Enter Apple Developer Team ID:"${NC} )" TEAM_ID
if [ -z "$TEAM_ID" ]; then
    echo -e "${YELLOW}Warning: No Team ID provided. You'll need to configure signing in Xcode${NC}"
fi
echo ""

# 7. Export method
echo -e "${YELLOW}Export Method:${NC}"
echo "  1. app-store (for App Store submission)"
echo "  2. ad-hoc (for distribution to registered devices)"
echo "  3. enterprise (for enterprise distribution)"
echo "  4. development (for development testing)"
echo ""
read -p "$(echo -e ${YELLOW}"Select export method (default: app-store):"${NC} )" EXPORT_METHOD
if [ -z "$EXPORT_METHOD" ]; then
    EXPORT_METHOD="app-store"
fi
echo -e "${GREEN}✓${NC} Export: ${BLUE}$EXPORT_METHOD${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Build Configuration Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "API URL:        ${BLUE}$PROD_API_URL${NC}"
echo -e "Bundle ID:      ${BLUE}$BUNDLE_ID${NC}"
echo -e "App Name:       ${BLUE}$APP_NAME${NC}"
echo -e "Version:        ${BLUE}$APP_VERSION${NC}"
echo -e "Build:          ${BLUE}$BUILD_NUMBER${NC}"
echo -e "Team ID:        ${BLUE}$TEAM_ID${NC}"
echo -e "Export Method:  ${BLUE}$EXPORT_METHOD${NC}"
echo ""

read -p "$(echo -e ${YELLOW}"Continue with these settings? (y/n):"${NC} )" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Build cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Configuring project...${NC}"

# Backup original files
cp "$API_SERVICE_FILE" "$API_SERVICE_FILE.prod-backup"

# Update API URL in APIService.swift
sed -i '' "s|return \".*\"|return \"$PROD_API_URL\"|" "$API_SERVICE_FILE"
echo -e "${GREEN}✓${NC} Updated API URL"

# Update project settings
cd "$IOS_PROJECT_DIR"

# Update Bundle Identifier
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID" "MindmapApp/Info.plist" 2>/dev/null || true

# Update Display Name
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "MindmapApp/Info.plist" 2>/dev/null || true

# Update Version
agvtool new-marketing-version "$APP_VERSION" >/dev/null 2>&1 || true

# Update Build Number
agvtool new-version -all "$BUILD_NUMBER" >/dev/null 2>&1 || true

echo -e "${GREEN}✓${NC} Updated project settings"
echo ""

# Create ExportOptions.plist
EXPORT_OPTIONS="$IOS_PROJECT_DIR/ExportOptions.plist"
cat > "$EXPORT_OPTIONS" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

echo -e "${YELLOW}Building archive...${NC}"
echo -e "${BLUE}This will take several minutes...${NC}"
echo ""

ARCHIVE_PATH="$IOS_PROJECT_DIR/build/MindmapApp.xcarchive"
mkdir -p "$IOS_PROJECT_DIR/build"

xcodebuild archive \
    -project MindmapApp.xcodeproj \
    -scheme MindmapApp \
    -archivePath "$ARCHIVE_PATH" \
    -configuration Release \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    PROVISIONING_PROFILE_SPECIFIER="" \
    2>&1 | grep -E "error:|warning:|Archive Succeeded|ARCHIVE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Archive created successfully"
    echo ""
    
    # Export IPA
    echo -e "${YELLOW}Exporting IPA...${NC}"
    EXPORT_PATH="$IOS_PROJECT_DIR/build/export"
    mkdir -p "$EXPORT_PATH"
    
    xcodebuild -exportArchive \
        -archivePath "$ARCHIVE_PATH" \
        -exportPath "$EXPORT_PATH" \
        -exportOptionsPlist "$EXPORT_OPTIONS" \
        2>&1 | grep -E "error:|warning:|Export Succeeded|EXPORT"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ Build Complete!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "IPA Location: ${BLUE}$EXPORT_PATH/MindmapApp.ipa${NC}"
        echo ""
        
        # Show next steps
        echo -e "${YELLOW}Next Steps:${NC}"
        echo ""
        
        if [ "$EXPORT_METHOD" == "app-store" ]; then
            echo "1. Upload to App Store Connect:"
            echo -e "   ${BLUE}xcrun altool --upload-app -f \"$EXPORT_PATH/MindmapApp.ipa\" -u YOUR_APPLE_ID -p YOUR_APP_SPECIFIC_PASSWORD${NC}"
            echo ""
            echo "   Or use Xcode:"
            echo "   - Open Xcode > Window > Organizer"
            echo "   - Select your archive > Distribute App"
            echo ""
            echo "2. Create an App Store Connect record:"
            echo "   - Visit https://appstoreconnect.apple.com"
            echo "   - Create new app with bundle ID: $BUNDLE_ID"
            echo "   - Fill in app information"
            echo "   - Add screenshots and description"
            echo ""
            echo "3. Submit for TestFlight:"
            echo "   - After upload, enable TestFlight testing"
            echo "   - Add internal/external testers"
            echo "   - Testers will receive email invitations"
            echo ""
        elif [ "$EXPORT_METHOD" == "ad-hoc" ]; then
            echo "1. Distribute IPA to testers"
            echo "2. Testers must:"
            echo "   - Have their device UDIDs registered"
            echo "   - Install via Xcode or OTA distribution"
            echo ""
        fi
        
        echo -e "${YELLOW}Important Files:${NC}"
        echo -e "  Archive: ${BLUE}$ARCHIVE_PATH${NC}"
        echo -e "  IPA:     ${BLUE}$EXPORT_PATH/MindmapApp.ipa${NC}"
        echo ""
        
        # Restore original API file
        echo -e "${YELLOW}Restoring development configuration...${NC}"
        mv "$API_SERVICE_FILE.prod-backup" "$API_SERVICE_FILE"
        echo -e "${GREEN}✓${NC} Done"
        echo ""
        
    else
        echo -e "${RED}Export failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Archive failed${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "  • Code signing not configured - open in Xcode and configure signing"
    echo "  • Wrong Team ID - check Apple Developer portal"
    echo "  • Missing provisioning profile - create in Apple Developer portal"
    echo "  • Certificate expired - renew in Apple Developer portal"
    echo ""
    echo "To fix: Open project in Xcode and go to:"
    echo "  Project > Signing & Capabilities > Configure signing"
    exit 1
fi
