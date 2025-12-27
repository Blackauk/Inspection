# Wrapping PPM System as a Native Mobile App with Capacitor

This guide explains how to wrap the PPM System web app into a native mobile app using Capacitor.

## Prerequisites

- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- The web app must be built and working

## Step 1: Install Capacitor

```bash
cd apps/web
npm install @capacitor/core @capacitor/cli
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: PPM System
- **App ID**: com.yourcompany.ppm
- **Web dir**: dist

## Step 3: Add Platform Support

### Android

```bash
npx cap add android
```

### iOS (macOS only)

```bash
npx cap add ios
```

## Step 4: Configure API Base URL

Update `apps/web/.env.production` or set environment variable:

```env
VITE_API_URL=https://your-api-domain.com
```

This ensures the app connects to your production API instead of localhost.

## Step 5: Build the Web App

```bash
cd apps/web
npm run build
```

This creates the `dist/` folder with the production build.

## Step 6: Copy Web Assets to Native Projects

```bash
npx cap copy
```

This copies the built web app into the native projects.

## Step 7: Open in Native IDE

### Android

```bash
npx cap open android
```

Then build and run from Android Studio.

### iOS

```bash
npx cap open ios
```

Then build and run from Xcode.

## Step 8: Sync After Changes

Whenever you make changes to the web app:

1. Rebuild: `npm run build`
2. Sync: `npx cap sync`
3. Rebuild in native IDE

## Optional: Add Native Features

### Camera for Photo Attachments

```bash
npm install @capacitor/camera
npx cap sync
```

Then use in your code:

```typescript
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Base64,
});
```

### File System

```bash
npm install @capacitor/filesystem
npx cap sync
```

### Network Status

```bash
npm install @capacitor/network
npx cap sync
```

## Configuration Files

### `capacitor.config.ts`

Located in `apps/web/`, you can configure:

- Server URL for development
- App ID
- App name
- Splash screen
- Icons

Example:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.ppm',
  appName: 'PPM System',
  webDir: 'dist',
  server: {
    // For development, point to your local API
    // url: 'http://192.168.1.100:3001',
    // cleartext: true,
  },
};

export default config;
```

## Building for Production

### Android

1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Follow the signing wizard

### iOS

1. Open Xcode
2. Product → Archive
3. Distribute to App Store or TestFlight

## Notes

- The web app is already PWA-ready, so it works offline
- All API calls go through the `apiClient` wrapper, making it easy to switch base URLs
- React Router works in WebView without issues
- File uploads work with Capacitor's file system plugin
- The app is mobile-first responsive, so it looks great on phones

## Troubleshooting

### API calls fail in mobile app

- Ensure `VITE_API_URL` is set to your production API
- Check CORS settings on your API server
- For development, use your computer's IP address instead of localhost

### Build errors

- Run `npx cap sync` after any npm install
- Clean and rebuild in native IDE
- Ensure all dependencies are installed

### Icons not showing

- Ensure PWA icons are in `apps/web/public/`
- Run `npx cap copy` after adding icons















