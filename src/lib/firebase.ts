import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, type Analytics } from 'firebase/analytics'

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {}

// 只在客户端初始化 Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let analytics: Analytics | null = null

// 确保只在客户端初始化一次
if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  analytics = getAnalytics(app)
} else {
  // 服务器端的空实现
  app = {} as unknown as FirebaseApp
  auth = {
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
    currentUser: null,
    app: {} as FirebaseApp,
    name: 'auth',
    config: {},
    setPersistence: async () => {},
    languageCode: null,
    emulatorConfig: null,
    settings: { appVerificationDisabledForTesting: false },
    tenantId: null,
    useDeviceLanguage: () => {},
  } as unknown as Auth
  db = {} as unknown as Firestore
}

export { app, auth, db, analytics } 