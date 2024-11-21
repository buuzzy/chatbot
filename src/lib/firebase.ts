import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {}

if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing')
}

const app = initializeApp(firebaseConfig)

let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export { analytics } 