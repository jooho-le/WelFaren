import type { CapacitorConfig } from '@capacitor/cli'

// For local live-reload on device/emulator, set CAP_SERVER_URL env, e.g.
//   CAP_SERVER_URL=http://192.168.0.10:5173 npm run mobile:android
// Otherwise the app will load the built files from "dist".
const serverUrl = process.env.CAP_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.welperin.app',
  appName: '웰파렌',
  webDir: 'dist',
  server: serverUrl
    ? { url: serverUrl, cleartext: true }
    : { androidScheme: 'https' }
}

export default config
