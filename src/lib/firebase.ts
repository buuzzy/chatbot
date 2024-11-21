import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {}

// 只在客户端初始化 Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
let auth = null
let db = null
let analytics = null

// 只在客户端环境下初始化服务
if (typeof window !== 'undefined') {
  auth = getAuth(app)
  db = getFirestore(app)
  analytics = getAnalytics(app)
}

export { app, auth, db, analytics } 