# Mindmap iOS App

A native iOS app for the Mindmap application built with SwiftUI. This app provides similar mindmapping functionalities as the web version and syncs data with the same backend.

## Features

- **Authentication**: Login and register with email/password
- **Mindmap List**: View, search, filter, and manage your mindmaps
- **Mindmap Editor**: Create and edit mindmaps with touch-friendly interface
  - Add nodes with tap
  - Move nodes with drag gesture
  - Connect nodes
  - Color customization
  - Pan and zoom canvas
- **Cross-platform Sync**: Data syncs with web and other platforms via the shared backend API
- **Favorites**: Mark mindmaps as favorites for quick access
- **Dark Mode**: Full dark mode support

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Project Structure

```
ios/MindmapApp/
├── MindmapApp.xcodeproj/     # Xcode project file
└── MindmapApp/
    ├── MindmapApp.swift      # App entry point
    ├── Models/
    │   ├── User.swift        # User model
    │   └── Mindmap.swift     # Mindmap data models
    ├── Views/
    │   ├── ContentView.swift        # Root view with auth state
    │   ├── LoginView.swift          # Login/Register views
    │   ├── MindmapListView.swift    # Dashboard with mindmap list
    │   ├── MindmapEditorView.swift  # Mindmap canvas editor
    │   └── ProfileView.swift        # User profile
    ├── ViewModels/
    │   ├── AuthViewModel.swift          # Authentication logic
    │   ├── MindmapListViewModel.swift   # List management
    │   └── MindmapEditorViewModel.swift # Editor state
    ├── Services/
    │   └── APIService.swift  # API client for backend communication
    └── Utils/
        └── (utility files)
```

## Quick Start

### Using Build Scripts (Recommended)

**Development Build:**
```bash
# From project root
./scripts/ios-dev-run.sh
```

This script automatically:
- Configures API URL from `.env` file
- Builds the app
- Launches in iOS Simulator

**Production Build:**
```bash
# From project root
./scripts/ios-prod-build.sh
```

Interactive script that prompts for:
- Production API URL
- Bundle ID, version, and build number
- Apple Developer Team ID
- Exports IPA for TestFlight/App Store

See `scripts/README.md` for detailed documentation.

### Manual Setup

### 1. Configure Backend URL

Edit `MindmapApp/Services/APIService.swift` and update the base URL:

```swift
private var baseURL: String {
    return "http://localhost:4000/api"  // For local development
    // return "https://api.yourdomain.com/api"  // For production
}
```

### 2. Open in Xcode

```bash
open ios/MindmapApp/MindmapApp.xcodeproj
```

### 3. Build and Run

1. Select your target device/simulator
2. Press `Cmd + R` to build and run

### 4. Start the Backend

Make sure the backend is running:

```bash
cd backend
npm run start:dev
```

## Usage

### Login/Register
- Open the app and login with existing credentials or create a new account
- Same credentials work across web and mobile

### Create Mindmap
- Tap the "+" button in the navigation bar
- Enter a title and tap "Create"

### Edit Mindmap
- Tap on a mindmap to open the editor
- **Add Node**: Tap the blue "+" floating button
- **Select Node**: Tap on any node
- **Move Node**: Drag a node to reposition
- **Add Child Node**: Select a node and tap the orange arrow button
- **Edit Label**: Select a node and tap the green pencil button
- **Change Color**: Select a node and tap the purple palette button
- **Delete Node**: Select a node and tap the red trash button
- **Pan Canvas**: Drag on empty space
- **Zoom**: Pinch gesture

### Save Changes
- Tap the save icon in the navigation bar
- Changes sync to the cloud and are available on all platforms

### Manage Mindmaps
- **Favorite**: Swipe right on a mindmap
- **Duplicate**: Swipe left and tap "Duplicate"
- **Delete**: Swipe left and tap "Delete"
- **Search**: Use the search bar to filter mindmaps

## API Endpoints Used

The app communicates with the backend using these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Mindmaps
- `GET /api/mindmaps` - List user's mindmaps
- `GET /api/mindmaps/:id` - Get single mindmap
- `POST /api/mindmaps` - Create mindmap
- `PUT /api/mindmaps/:id` - Update mindmap
- `DELETE /api/mindmaps/:id` - Delete mindmap
- `POST /api/mindmaps/:id/favorite` - Toggle favorite
- `POST /api/mindmaps/:id/duplicate` - Duplicate mindmap

## Data Synchronization

The iOS app uses the same backend API as the web application, ensuring:

1. **Real-time sync**: Changes made on iOS appear on web and vice versa
2. **Same data format**: Mindmap data (nodes, edges, positions) uses identical JSON structure
3. **Shared authentication**: Same user accounts work across platforms
4. **Consistent experience**: Similar features and workflow on all platforms

## Troubleshooting

### Cannot connect to backend
1. Ensure backend is running (`npm run start:dev` in backend folder)
2. Check the API URL in `APIService.swift`
3. For simulator: use `localhost`
4. For device: use your computer's IP address (must be on same network)

### Build errors
1. Clean build folder (`Cmd + Shift + K`)
2. Delete derived data
3. Ensure Xcode 15+ is installed

### Authentication issues
1. Check if tokens are being stored correctly
2. Verify backend is accepting requests
3. Check for CORS issues (shouldn't affect native apps)

## Future Enhancements

- Real-time collaboration via WebSocket
- Offline mode with local storage
- Export to image/PDF
- Share mindmaps with link
- Apple Pencil support for iPad
- Keyboard shortcuts for external keyboards
- Widgets for quick access
- Siri shortcuts

## License

MIT License - See LICENSE file for details
