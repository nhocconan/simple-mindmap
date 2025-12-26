# iOS App Testing Guide

## ✅ Current Status

- **Backend:** Running on port 4000
- **iOS App:** Installed and running in iPhone 17 Pro simulator
- **API URL:** http://localhost:4000/api (now fixed!)

## 🔐 Login Credentials

```
Email:    admin@mindmap.app
Password: Admin@123!
```

## 🧪 Testing Steps

### 1. Login Test
1. Open Mindmap app in simulator (should be open)
2. Enter the credentials above
3. Tap "Sign In"
4. **Expected:** Login success, navigate to mindmap list

### 2. View Mindmaps
1. After login, you should see the dashboard
2. **Expected:** List of mindmaps (may be empty if fresh database)

### 3. Create Mindmap
1. Tap the "+" button (top right)
2. Enter title: "Test Mindmap"
3. Tap "Create"
4. **Expected:** New mindmap created, navigate to editor

### 4. Edit Mindmap
1. You should be in the editor view
2. Try these gestures:
   - **Tap blue + button:** Adds a new node
   - **Drag a node:** Moves it around
   - **Pinch:** Zoom in/out
   - **Two finger drag:** Pan canvas
   - **Tap a node:** Select it
   - **Tap green pencil:** Edit node label
   - **Tap purple palette:** Change colors
   - **Tap orange arrow:** Add child node
   - **Tap red trash:** Delete node
3. **Expected:** All gestures work smoothly

### 5. Save Changes
1. After making changes, tap "Save" (top right)
2. **Expected:** "Saved successfully" message
3. Go back to list
4. **Expected:** Changes persisted

### 6. Cross-Platform Sync Test
1. Create/edit a mindmap in iOS app
2. Save it
3. Open browser: http://localhost:3000
4. Login with same credentials
5. **Expected:** See the same mindmap on web
6. Edit on web, save
7. Pull to refresh in iOS app
8. **Expected:** See web changes in iOS

## 🐛 Troubleshooting

### "Invalid URL" or Network Error

**Cause:** Backend not running or APIService.swift has wrong URL

**Fix:**
```bash
# 1. Check backend is running
curl http://localhost:4000/api/auth/me
# Should return: {"message":"Unauthorized","statusCode":401}

# 2. If not running, restart backend
cd backend
npm run start:dev

# 3. Rebuild iOS app
./scripts/ios-dev-run.sh
```

### Login Button Not Responding

**Cause:** Empty email or password fields

**Fix:** Ensure both fields are filled

### "Unauthorized" Error

**Cause:** Wrong credentials

**Fix:** Use exact credentials:
- Email: `admin@mindmap.app`
- Password: `Admin@123!`

### App Crashes on Launch

**Cause:** Backend connection issue

**Fix:**
1. Check backend logs (terminal with backend running)
2. Restart backend
3. Rebuild app

### Backend Logs Show Errors

**Redis authentication errors:** Safe to ignore, won't affect functionality

**Database errors:** Run:
```bash
cd backend
npx prisma migrate reset --force
npm run start:dev
```

## 📊 Testing Checklist

Use this checklist to verify all features:

### Authentication
- [ ] Login with admin credentials
- [ ] Logout
- [ ] Login again
- [ ] View profile

### Mindmap List
- [ ] View empty list
- [ ] Create first mindmap
- [ ] View list with mindmaps
- [ ] Search mindmaps
- [ ] Filter by favorites
- [ ] Swipe right to favorite
- [ ] Swipe left to see options
- [ ] Duplicate mindmap
- [ ] Delete mindmap
- [ ] Pull to refresh

### Mindmap Editor
- [ ] Open mindmap
- [ ] See initial node
- [ ] Add new node (blue +)
- [ ] Select node (tap)
- [ ] Move node (drag)
- [ ] Edit node label (green pencil)
- [ ] Change node color (purple palette)
- [ ] Change text color (purple palette)
- [ ] Add child node (orange arrow)
- [ ] Delete node (red trash)
- [ ] Pan canvas (two finger drag)
- [ ] Zoom canvas (pinch)
- [ ] See node count at bottom
- [ ] Save changes (top right)
- [ ] See "Unsaved" indicator before saving
- [ ] Go back to list

### Cross-Platform Sync
- [ ] Create mindmap on iOS
- [ ] View on web (http://localhost:3000)
- [ ] Edit on web
- [ ] Refresh on iOS (pull down)
- [ ] Verify changes sync
- [ ] Edit on iOS
- [ ] Save
- [ ] Refresh web
- [ ] Verify changes sync

## 🎯 Expected Performance

- **Login:** < 1 second
- **Load mindmaps list:** < 500ms
- **Open mindmap:** < 500ms
- **Save changes:** < 500ms
- **Canvas gestures:** 60fps smooth

## 📝 Known Issues

1. **Redis Auth Warnings:** Appear in backend logs but don't affect functionality
2. **First Load:** May take 1-2 seconds for initial API connection

## 🚀 Next Steps After Testing

If everything works:
1. Test on a real device (need Apple Developer account)
2. Build for production: `./scripts/ios-prod-build.sh`
3. Submit to TestFlight
4. Gather user feedback
5. Iterate and improve

## 💡 Tips

- **Keep Backend Running:** App needs backend to work
- **Pull to Refresh:** Always refreshes latest data
- **Save Frequently:** Changes only persist after tapping Save
- **Use Gestures:** Touch interface optimized for natural gestures

---

**Ready to test?** Open the Mindmap app in the simulator and start with the login! 🎉
