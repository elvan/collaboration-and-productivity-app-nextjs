import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getMessaging, Messaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | undefined
let messaging: Messaging | undefined

export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp
}

export function getFirebaseMessaging() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    if (!messaging) {
      const app = initializeFirebase()
      messaging = getMessaging(app)
    }
    return messaging
  }
  return null
}
