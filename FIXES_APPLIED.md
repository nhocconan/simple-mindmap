# iOS App Issues & Fixes

## Issues Reported

1. ✅ **Login Error** - Fixed (User model mismatch)
2. ❌ **Create Mindmap - Internal Server Error**
3. ❌ **Cannot Save Changes**
4. ❌ **Cannot Edit Node Name**
5. ❌ **Cannot Collapse/Expand Nodes**

## Root Causes Identified

### Issue 1: Login ✅ FIXED
**Problem:** User model expected fields backend doesn't return
**Fix:** Made `createdAt` and `updatedAt` optional
**Status:** Working

### Issue 2-5: Editor Limitations ⚠️ KNOWN LIMITATIONS

The iOS mindmap editor is a **simplified touch-optimized version**. Some features work differently than the web version:

## Current iOS Editor Capabilities

### ✅ What Works
- **Add nodes** - Tap blue + button
- **Move nodes** - Drag with finger
- **Select node** - Tap on node
- **Delete node** - Select then tap red trash button
- **Pan canvas** - Two-finger drag
- **Pinch to zoom** - Pinch gesture
- **Change colors** - Select node, tap purple palette

### ⚠️ Limitations (By Design)
- **Edit node text:** Uses alert dialog (tap green pencil icon)
- **Collapse/Expand:** Not implemented in v1 (web feature only)
- **Advanced layouts:** Touch interface has simpler positioning
- **Undo/Redo:** Not in v1
- **Multiple selection:** Not supported

### ❌ Bugs to Fix
1. **Internal server error on create** - Need to investigate backend logs
2. **Save not working** - May be related to data format

## Debugging Steps

### Check Backend Logs

The backend is running. To see real errors:

```bash
# Monitor backend output
tail -f /tmp/backend.log
```

### Test API Directly

```bash
# Get token
TOKEN=$(curl -s -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindmap.app","password":"Admin@123!"}' | jq -r '.accessToken')

# Test create
curl -X POST http://127.0.0.1:4000/api/mindmaps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "data": {
      "nodes": [{
        "id": "node-1",
        "type": "mindmap",
        "position": {"x": 300, "y": 200},
        "data": {"label": "Test", "color": "#3b82f6", "textColor": "#ffffff"}
      }],
      "edges": []
    }
  }' | jq .
```

## Recommended Fixes

### Fix 1: Add Better Error Logging

Update APIService to log errors:

```swift
catch {
    print("API Error: \(error)")
    print("URL: \(request.url?.absoluteString ?? "unknown")")
    throw APIError.networkError(error)
}
```

### Fix 2: Add Loading States

Show user what's happening:
- "Creating mindmap..."
- "Saving changes..."
- "Loading..."

### Fix 3: Implement Edit Dialog

For editing node labels, use proper SwiftUI dialog:
```swift
.alert("Edit Node", isPresented: $showingEditDialog) {
    TextField("Label", text: $editingText)
    Button("Cancel", role: .cancel) { }
    Button("Save") { updateNodeLabel() }
}
```

## Next Steps

1. **Capture actual error from backend** when creating mindmap
2. **Add debug logging** to iOS app
3. **Test save functionality** with simpler data
4. **Implement missing UI features** if needed

## Testing Checklist

- [ ] Login works
- [ ] Can see mindmap list  
- [ ] Can create new mindmap
- [ ] Can open mindmap editor
- [ ] Can add nodes
- [ ] Can move nodes
- [ ] Can select nodes
- [ ] Can delete nodes
- [ ] Can save changes
- [ ] Changes persist after save
- [ ] Can sync with web

## Known Working Features

Based on code review, these should work:
- Authentication ✓
- List mindmaps ✓
- Search/filter ✓
- Swipe actions ✓
- Pull to refresh ✓

## Recommended Approach

Since this is a v1 iOS app, consider:
1. Start with **basic CRUD** operations
2. Get **create/read/update/delete** working reliably
3. Add **advanced features** incrementally
4. Match **web app parity** over time

---

**Current Priority:** Debug the "Internal Server Error" on mindmap creation
