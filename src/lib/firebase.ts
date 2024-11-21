import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, type Analytics } from 'firebase/analytics'

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {}

// 只在客户端初始化 Firebase
let app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null

// 只在客户端环境下初始化服务
if (typeof window !== 'undefined') {
  auth = getAuth(app)
  db = getFirestore(app)
  analytics = getAnalytics(app)
}

export { app, auth, db, analytics } 