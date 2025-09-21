// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth"
import { getFunctions } from "firebase/functions"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDfPNJbD4QruCyiqKpMkcBKj--ExxX9cU",
  authDomain: "liftlog-97567.firebaseapp.com",
  projectId: "liftlog-97567",
  appId: "1:222314261215:web:709546fee8b59363fc176a",
  measurementId: "G-EX5LGHKWV2",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export const functions = getFunctions(app, "australia-southeast1")
export const db = getFirestore(app)

/**
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider())
  } catch (e: any) {
    // When blocked by identity function you'll typically see auth/… with a message
    const msg = e?.message || ""
    if (
      msg.includes("school Google account") ||
      msg.includes("permission-denied")
    ) {
      alert("Please use your university Google account (@auckland.ac.nz).")
      return
    }
    throw e // let your global handler show other errors
  }
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut() {
  return auth.signOut()
}

/**
 * Trigger a callback when user auth state changes.
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangedHelper(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback)
}
