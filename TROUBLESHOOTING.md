# 🔍 Troubleshooting Guide

## Issue: Blank Page with Only Header

The page is loading but content is not displaying. Here's how to diagnose:

### Step 1: Check Browser Console

1. Open the page: http://localhost:5173/
2. Press `F12` to open DevTools
3. Click on the **Console** tab
4. Look for any red error messages

**Common errors to look for:**
- `Cannot read property 'map' of undefined`
- `Network Error`
- `CORS Error`
- Module import errors

### Step 2: Check Network Tab

1. In DevTools, click the **Network** tab
2. Refresh the page (`Cmd+R` or `Ctrl+R`)
3. Look for a request to `/api/publications`
4. Click on it and check:
   - **Status**: Should be `200 OK`
   - **Response**: Should show JSON with publications data

### Step 3: Verify API is Working

Open a new terminal and run:
```bash
curl http://localhost:3000/api/publications
```

You should see JSON with 6 publications. If not, the backend might have crashed.

### Step 4: Check if Servers are Running

```bash
# Check backend
lsof -i :3000

# Check frontend  
lsof -i :5173
```

Both should show running processes.

### Step 5: Common Fixes

#### Fix 1: Restart Servers
```bash
./restart-servers.sh
```

#### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Fix 3: Check CORS
The backend should allow requests from `http://localhost:5173`. Check `backend/.env`:
```
CORS_ORIGIN=http://localhost:5173
```

#### Fix 4: Rebuild Frontend
```bash
# Stop servers (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

### Step 6: Manual Test

Try accessing the admin login page:
```
http://localhost:5173/admin/login
```

If this works but the home page doesn't, the issue is specific to the Home component.

### Step 7: Check Component Rendering

Add this to `src/components/public/Home.jsx` at the top of the component:
```javascript
console.log('Home component rendering');
console.log('Featured publications:', featuredPublications);
console.log('Loading:', loading);
```

Refresh the page and check the console for these logs.

### Expected Behavior

When working correctly, you should see:
1. **Header**: "Bob Demo Catalog" at the top
2. **Hero Section**: Large title, description, and "Browse Publications" button
3. **Featured Publications**: Grid of 6 publication cards
4. **Demo Catalog**: Section at the bottom

### Quick Diagnostic Commands

```bash
# Check if backend is responding
curl http://localhost:3000/health

# Check if publications exist
curl http://localhost:3000/api/publications | grep -o '"totalCount":[0-9]*'

# Check backend logs
# Look at the terminal where restart-servers.sh is running

# Check frontend is serving
curl -I http://localhost:5173/
```

### If Nothing Works

1. Stop all servers (Ctrl+C)
2. Stop Docker container:
   ```bash
   docker stop admin-postgres
   ```
3. Run full setup again:
   ```bash
   ./start-local.sh
   ```

### Get Help

If you're still stuck, provide:
1. Screenshot of browser console errors
2. Output of `curl http://localhost:3000/api/publications`
3. Any error messages from the terminal

---

## Most Likely Causes

Based on the screenshot showing just the header:

1. **CSS Issue**: Content might be rendered but hidden
   - Check if removing `overflow: hidden` or `display: none` in CSS helps
   
2. **API Call Failing**: The Home component catches errors silently
   - Check browser Network tab for failed requests
   
3. **Component Not Mounting**: React might be failing to render
   - Check console for React errors

4. **Data Format Issue**: API returns data but in unexpected format
   - The refactored controller changed the response structure
   - Check if `response.data.data` path is correct

---

**Most Common Fix**: Clear browser cache and hard reload!