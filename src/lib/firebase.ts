import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, type Analytics } from 'firebase/analytics'

// 直接使用配置对象，避免 JSON.parse 可能的问题
const firebaseConfig = {
  apiKey: "AIzaSyAfm4kqFxSJoVF61soC9Tc38oGmSGq6tdw",
  authDomain: "chatbotbzy.firebaseapp.com",
  projectId: "chatbotbzy",
  storageBucket: "chatbotbzy.firebasestorage.app",
  messagingSenderId: "1087130317256",
  appId: "1:1087130317256:web:806491ca71dc2cf56e10fd",
  measurementId: "G-LD3SQRGG3Q"
}

// 只在客户端初始化 Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let analytics: Analytics | null = null

// 确保只在客户端初始化一次
if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    analytics = getAnalytics(app)
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
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