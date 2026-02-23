# Android Emulator Network Troubleshooting

## Problem
Android emulator shows "site can't be reached" when trying to connect to backend at `http://10.0.2.2:3000`

## Backend Status
✅ Backend is running on `localhost:3000` (verified)
✅ Backend responds to requests from host machine
✅ Mobile app is configured correctly with `10.0.2.2:3000` for Android

## Solutions to Try

### 1. Check macOS Firewall (Most Common Issue)

The macOS firewall might be blocking incoming connections from the emulator.

**Option A: Allow Node.js through firewall**
1. Open **System Settings** → **Network** → **Firewall**
2. Click **Options** (if firewall is on)
3. Find "node" in the list or click + to add it
4. Ensure it's set to **"Allow incoming connections"**

**Option B: Temporarily disable firewall to test**
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Temporarily disable (just for testing)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Re-enable after testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### 2. Use Your Machine's Local Network IP

Instead of `10.0.2.2`, use your actual local network IP:

**Find your IP:**
```bash
# WiFi
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1

# Or use this to get all IPs
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Update mobile/.env (or create it):**
```bash
cd mobile
echo "EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000" > .env
```

Replace `YOUR_LOCAL_IP` with your actual IP (e.g., `192.168.1.100`)

Then restart Metro:
```bash
npm start
```

### 3. Test Connection from Emulator

Use the network test utility:

1. Add this to your login screen or any screen:
```typescript
import { testBackendConnectivity } from '../common/utils/networkTest';

// In your component
useEffect(() => {
  testBackendConnectivity().then(result => {
    console.log('Network test result:', result);
    Alert.alert('Network Test', JSON.stringify(result, null, 2));
  });
}, []);
```

2. Check the output in Metro logs

### 4. Verify Emulator Network Settings

**In Android Studio:**
1. Open **AVD Manager**
2. Edit your emulator
3. Show **Advanced Settings**
4. Under **Network**, ensure it's set to use host machine's network

### 5. Alternative: Use adb Reverse (Port Forwarding)

Forward the emulator's port to your machine:

```bash
# Forward port 3000 from emulator to host
adb reverse tcp:3000 tcp:3000

# Then use localhost:3000 in the app (works for both iOS and Android)
```

Update `mobile/src/config/index.ts`:
```typescript
const DEFAULT_API_BASE_URL = 'http://localhost:3000'; // Works with adb reverse
```

## Quick Test Commands

```bash
# 1. Verify backend is running
curl http://localhost:3000/api/v1/health

# 2. Check what's on port 3000
lsof -i :3000

# 3. Test from emulator (run in emulator's adb shell)
adb shell
curl http://10.0.2.2:3000/api/v1/health
```

## Most Likely Solution

Based on the symptoms, **macOS Firewall** is probably blocking the connection. Try:

1. Allow Node.js through the firewall, OR
2. Use `adb reverse` (simplest), OR  
3. Use your local network IP instead of `10.0.2.2`
