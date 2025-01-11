import * as functions from "firebase-functions"
import { initializeApp } from "firebase-admin/app"
import { Firestore } from "firebase-admin/firestore"
import * as logger from "firebase-functions/logger"

initializeApp()

const firestore = new Firestore()

export const createUser = functions.identity.beforeUserCreated(
  {
    region: "australia-southeast1",
  },
  (event) => {
    const user = event.data // User data from the event

    if (!user) {
      logger.error("User data is undefined in beforeUserCreated event.")
      throw new Error("Invalid user data.")
    }

    const userInfo = {
      uid: user.uid,
      email: user.email,
      photoUrl: user.photoURL,
    }

    firestore.collection("users").doc(user.uid).set(userInfo)
    logger.info(`User Created: ${JSON.stringify(userInfo)}`)
    return
  }
)
