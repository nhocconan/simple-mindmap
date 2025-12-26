# iOS Build Scripts

This directory contains scripts for building and running the iOS app.

## Prerequisites

Before using these scripts, ensure you have:

1. **Xcode 15.0+** installed from the App Store
2. **iOS Simulator** installed (via Xcode > Settings > Platforms)
3. **Command Line Tools** installed:
   ```bash
   xcode-select --install
   ```
4. **Backend running** (for development):
   ```bash
   cd backend
   npm run start:dev
   ```

## Scripts

### 1. `ios-dev-run.sh` - Development Build & Run

Automatically builds and launches the iOS app in the simulator using your local development environment.

**Usage:**
```bash
./scripts/ios-dev-run.sh
```

**What it does:**
- Reads API URL from `.env` file
- Configures `APIService.swift` with local backend URL
- Checks if backend is running
- Lists available iOS simulators
- Builds the app for simulator
- Installs and launches on simulator

**Requirements:**
- Backend must be running at the URL specified in `.env`
- iOS Simulator must be installed

**Output:**
```
========================================
  Mindmap iOS Development Build
========================================

✓ Found backend URL: http://localhost:4000
✓ API URL: http://localhost:4000/api
✓ APIService.swift configured
✓ Backend is reachable
Selected: iPhone 15 Pro
✓ Build successful!
========================================
  ✓ App launched!
========================================
```

### 2. `ios-prod-build.sh` - Production Build

Interactive script for building the iOS app for TestFlight or App Store distribution.

**Usage:**
```bash
./scripts/ios-prod-build.sh
```

**What it does:**
- Prompts for production configuration:
  - Production API URL (e.g., `https://api.yourdomain.com`)
  - Bundle Identifier (e.g., `com.yourcompany.mindmap`)
  - App Display Name
  - Version number
  - Build number
  - Apple Developer Team ID
  - Export method (App Store, Ad-Hoc, Enterprise, Development)
- Updates project configuration
- Builds archive
- Exports IPA file
- Provides next steps for distribution

**Example Session:**
```
Enter production API URL: https://api.mindmap.app
Enter Bundle Identifier: com.mindmap.app
Enter App Display Name: Mindmap
Enter App Version: 1.0.0
Enter Build Number: 1
Enter Apple Developer Team ID: ABCDE12345
Select export method: app-store

Build Configuration Summary
─────────────────────────────
API URL:        https://api.mindmap.app/api
Bundle ID:      com.mindmap.app
App Name:       Mindmap
Version:        1.0.0
Build:          1
Team ID:        ABCDE12345
Export Method:  app-store

Continue with these settings? (y/n): y
```

**Output:**
- Archive: `ios/MindmapApp/build/MindmapApp.xcarchive`
- IPA file: `ios/MindmapApp/build/export/MindmapApp.ipa`

## Troubleshooting

### "Xcode is not installed"
Install Xcode from the App Store: https://apps.apple.com/app/xcode/id497799835

### "No simulators found"
1. Open Xcode
2. Go to Settings > Platforms
3. Download iOS Simulator (latest version)

### "Backend may not be running"
Start the backend:
```bash
cd backend
npm run start:dev
```

### "Build failed" - Code signing issues
For production builds, you need:
1. Apple Developer account ($99/year)
2. Certificate and provisioning profile
3. Correct Team ID

To configure signing:
1. Open `ios/MindmapApp/MindmapApp.xcodeproj` in Xcode
2. Select the project in navigator
3. Select "MindmapApp" target
4. Go to "Signing & Capabilities" tab
5. Select your team and configure signing

### "Archive failed"
Common causes:
- Invalid Team ID
- Missing provisioning profile
- Expired certificate
- Bundle ID mismatch

Solution: Open project in Xcode and check signing settings.

## TestFlight Distribution

After successful production build:

1. **Upload to App Store Connect:**
   ```bash
   xcrun altool --upload-app \
     -f ios/MindmapApp/build/export/MindmapApp.ipa \
     -u YOUR_APPLE_ID \
     -p YOUR_APP_SPECIFIC_PASSWORD
   ```

2. **Or use Xcode:**
   - Window > Organizer
   - Select your archive
   - Click "Distribute App"
   - Follow the wizard

3. **Enable TestFlight:**
   - Go to App Store Connect
   - Select your app
   - Go to TestFlight tab
   - Add internal/external testers
   - Submit for review (external testers only)

## App Store Submission

1. **Create App Store Connect Record:**
   - Visit https://appstoreconnect.apple.com
   - Click "+" > New App
   - Enter app information
   - Use same Bundle ID as in build

2. **Prepare Metadata:**
   - App name
   - Description
   - Keywords
   - Screenshots (required sizes)
   - Privacy policy URL
   - Support URL

3. **Submit for Review:**
   - Select build from TestFlight
   - Complete all required information
   - Submit for App Store review

## Continuous Integration

For automated builds, use fastlane or Xcode Cloud:

### Fastlane Example:
```ruby
lane :beta do
  build_app(scheme: "MindmapApp")
  upload_to_testflight
end
```

### Xcode Cloud:
1. Connect repository to Xcode Cloud
2. Configure workflow
3. Automatic builds on push/tag

## Environment Variables

The scripts use these from `.env`:

- `NEXT_PUBLIC_API_URL` - Backend API URL for development

For production, you'll be prompted to enter:
- Production API URL
- Bundle Identifier
- App Store credentials

## Useful Commands

**List simulators:**
```bash
xcrun simctl list devices available
```

**View app logs:**
```bash
xcrun simctl spawn booted log stream --predicate 'process == "MindmapApp"'
```

**Uninstall app:**
```bash
xcrun simctl uninstall booted com.mindmap.app
```

**Reset simulator:**
```bash
xcrun simctl erase all
```

## Support

For issues:
1. Check troubleshooting section above
2. Verify Xcode and simulators are installed
3. Check backend is running (for dev builds)
4. Review build output for specific errors
5. Open project in Xcode for detailed diagnostics
