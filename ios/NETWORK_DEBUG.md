# iOS Simulator Network Debugging

## Issue: "Could not connect to the server"

The iOS Simulator is unable to reach `http://localhost:4000/api`

## Why This Happens

iOS Simulator networking can have issues with `localhost`. While newer iOS versions should support it, there are known quirks.

## Solutions

### Solution 1: Use 127.0.0.1 Instead of localhost

This is the most reliable for iOS Simulator.

**Steps:**
1. Update APIService.swift:
   ```swift
   private var baseURL: String {
       return "http://127.0.0.1:4000/api"  // Changed from localhost
   }
   ```

2. Rebuild:
   ```bash
   ./scripts/ios-dev-run.sh
   ```

### Solution 2: Use Computer's Local IP (for Real Device)

If testing on a real device, use your computer's IP address.

**Your IP:** `192.168.1.44`

**Steps:**
1. Update APIService.swift:
   ```swift
   private var baseURL: String {
       #if targetEnvironment(simulator)
       return "http://127.0.0.1:4000/api"
       #else
       return "http://192.168.1.44:4000/api"  // Your computer's IP
       #endif
   }
   ```

2. Rebuild

### Solution 3: Test from Simulator Terminal

You can test if simulator can reach the backend:

```bash
# Get simulator's ability to curl
xcrun simctl spawn booted curl -v http://localhost:4000/api/auth/me
# or
xcrun simctl spawn booted curl -v http://127.0.0.1:4000/api/auth/me
```

## Current Status

✅ Backend is running and accessible from host machine
✅ Login works: `curl http://localhost:4000/api/auth/login`
❌ iOS Simulator cannot reach `localhost`

## Recommended Fix

Use `127.0.0.1` instead of `localhost` - this is the most reliable option for iOS Simulator.

I'll apply this fix now...
