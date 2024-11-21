import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAfm4kqFxSJoVF61soC9Tc38oGmSGq6tdw",
  authDomain: "chatbotbzy.firebaseapp.com",
  projectId: "chatbotbzy",
  storageBucket: "chatbotbzy.firebasestorage.app",
  messagingSenderId: "1087130317256",
  appId: "1:1087130317256:web:806491ca71dc2cf56e10fd",
  measurementId: "G-LD3SQRGG3Q"
}

const app = initializeApp(firebaseConfig)

// 由于 analytics 只能在浏览器环境中使用，需要进行环境检查
let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export { analytics } 