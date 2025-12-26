# Getting Started with iOS App

## Current Status

✅ **iOS app implementation is complete**
⚠️ **Xcode is required to build and run the app**

Your current system has Xcode Command Line Tools but not the full Xcode application with iOS Simulator.

## Installation Steps

### 1. Install Xcode (Required)

**Option A: App Store (Recommended)**
1. Open App Store on your Mac
2. Search for "Xcode"
3. Click "Get" or "Install" (it's free)
4. Wait for download to complete (~12GB, 30-60 minutes)

**Option B: Direct Download**
1. Visit https://developer.apple.com/xcode/
2. Download latest version
3. Install Xcode.app to Applications folder

### 2. Install iOS Simulator

After Xcode installation:
1. Open Xcode
2. Go to **Xcode > Settings > Platforms**
3. Click the **+** button
4. Select **iOS** and download (if not already installed)
5. Wait for simulator download to complete

### 3. Accept License Agreement

```bash
sudo xcodebuild -license accept
```

### 4. Set Xcode as Active Developer Directory

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 5. Verify Installation

```bash
# Check Xcode version
xcodebuild -version

# Check available simulators
xcrun simctl list devices available | grep iPhone
```

You should see:
```
Xcode 15.x
Build version xxx

iPhone 14
iPhone 14 Plus
iPhone 15
iPhone 15 Pro
...
```

## Quick Start (After Xcode Installation)

### Step 1: Start Backend

```bash
cd backend
npm run start:dev
```

Keep this terminal window open.

### Step 2: Build and Run iOS App

Open a new terminal:

```bash
cd /Users/Shared/TienLe-Data/Workspace/AI-Dev/simple-mindmap/mindmap-copilot
./scripts/ios-dev-run.sh
```

The script will:
1. ✅ Read backend URL from `.env` (http://localhost:4000)
2. ✅ Configure iOS app with this URL
3. ✅ Check backend is running
4. ✅ List available iOS simulators
5. ✅ Build the app (3-5 minutes first time)
6. ✅ Launch app in simulator
7. ✅ Open simulator window

### Step 3: Use the App

1. **Simulator window opens** - You'll see an iPhone simulator
2. **App launches automatically** - Mindmap app icon appears and opens
3. **Login screen appears** - Use same credentials as web app
4. **Start creating mindmaps!** - Full touch interface with gestures

## What to Expect

### First Build (Development)
```
========================================
  Mindmap iOS Development Build
========================================

✓ Found backend URL: http://localhost:4000
✓ API URL: http://localhost:4000/api
✓ APIService.swift configured
✓ Backend is reachable

Available iOS Simulators:
 1. iPhone 14 (...)
 2. iPhone 14 Pro (...)
 3. iPhone 15 (...)
 4. iPhone 15 Pro (...)

Selected: iPhone 15 Pro

Building...
[Build progress...]
✓ Build successful!

========================================
  ✓ App launched!
========================================

API: http://localhost:4000/api
Simulator: iPhone 15 Pro
```

### Using the App

**Login:**
- Email: admin@mindmap.app
- Password: Admin@123!
- (or create new account)

**Main Screen:**
- List of your mindmaps
- Pull down to refresh
- Search bar to filter
- Tap + to create new

**Creating Mindmap:**
- Tap + button
- Enter title
- Tap Create
- Opens in editor

**Editor:**
- Blue + button: Add node
- Drag nodes to move
- Pinch to zoom
- Two fingers to pan
- Tap node to select
- Green pencil: Edit label
- Purple palette: Change colors
- Orange arrow: Add child
- Red trash: Delete
- Save button (top right)

**Gestures:**
- Tap: Select node
- Double tap: Zoom in
- Drag: Move node/pan canvas
- Pinch: Zoom in/out
- Swipe on list: Quick actions

## Production Build (For App Store)

When ready to publish:

```bash
./scripts/ios-prod-build.sh
```

You'll be prompted for:
- Production API URL (e.g., https://api.yourdomain.com)
- Bundle Identifier (e.g., com.yourcompany.mindmap)
- App name, version, build number
- Apple Developer Team ID (from developer.apple.com)

Output:
- IPA file ready for upload
- Instructions for TestFlight/App Store

## Troubleshooting

### "Xcode is not installed"
Install Xcode from App Store (see Installation Steps above)

### "No simulators found"
Install iOS Simulator via Xcode > Settings > Platforms

### "Backend may not be running"
```bash
cd backend
npm run start:dev
```

### "Build failed" - Signing Error
For development builds, this shouldn't happen. If it does:
1. Open Xcode: `open ios/MindmapApp/MindmapApp.xcodeproj`
2. Select project in navigator
3. Go to Signing & Capabilities
4. Choose your team (or select "Automatically manage signing")

### App crashes on launch
Check backend is running and URL is correct:
```bash
curl http://localhost:4000/api
```

Should return JSON (even if it's an error about authorization)

## Useful Commands

**View app logs:**
```bash
# Find your simulator ID
xcrun simctl list devices | grep Booted

# View logs for that simulator
xcrun simctl spawn [SIMULATOR_ID] log stream --predicate 'process == "MindmapApp"'
```

**Restart app:**
```bash
xcrun simctl launch booted com.mindmap.app
```

**Uninstall app:**
```bash
xcrun simctl uninstall booted com.mindmap.app
```

**Reset simulator:**
```bash
xcrun simctl erase all
```

**List all simulators:**
```bash
xcrun simctl list devices available
```

## Development Tips

**Hot Reload:**
Xcode doesn't have hot reload like web apps. To see changes:
1. Edit code in Xcode
2. Press Cmd+R to rebuild and run
3. Or use SwiftUI previews in Xcode

**Debugging:**
1. Open project in Xcode
2. Set breakpoints
3. Run with Cmd+R
4. Debug console shows output

**UI Preview:**
1. Open any View file in Xcode
2. Canvas appears on right (if not, Cmd+Option+Enter)
3. Click "Resume" to see live preview
4. Edit code, preview updates automatically

## Next Steps

1. ✅ Install Xcode
2. ✅ Run development build script
3. ✅ Test all features
4. ✅ Create test account
5. ✅ Create sample mindmaps
6. ✅ Verify sync with web app
7. 📱 Register for Apple Developer (for device testing)
8. 📱 Run production build script
9. 📱 Submit to TestFlight
10. 🚀 Launch on App Store

## Support

Questions or issues?
1. Check `scripts/README.md` for detailed docs
2. Review `ios/README.md` for app features
3. Check Xcode build output for errors
4. Verify all prerequisites are installed

## Estimated Time

- Xcode installation: 1-2 hours
- First build and test: 15 minutes
- Learning the app: 10 minutes
- **Total to running app: ~2 hours** (mostly Xcode download)

---

**Ready to start?** Install Xcode, then run `./scripts/ios-dev-run.sh` 🚀
