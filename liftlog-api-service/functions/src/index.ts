import * as functions from "firebase-functions"
import { initializeApp } from "firebase-admin/app"
import { Firestore } from "firebase-admin/firestore"
import * as logger from "firebase-functions/logger"
import { Storage } from "@google-cloud/storage"
import { onCall } from "firebase-functions/v2/https"

initializeApp()

const firestore = new Firestore()
const storage = new Storage()
const rawVideoBucketName = "liftlog-raw-videos"
const videoCollectionId = "videos"
const thumbnailBucketName = "liftlog-thumbnails"

export interface Video {
  id?: string
  uid?: string
  filename?: string
  status?: "processing" | "processed"
  title?: string
  description?: string
  thumbnailUrl?: string
}

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

export const generateUploadUrl = onCall(
  { maxInstances: 1 },
  async (request) => {
    // Check if the user is authentication
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated."
      )
    }

    const auth = request.auth
    const data = request.data
    const bucket = storage.bucket(rawVideoBucketName)

    // Generate a unique filename for upload
    const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`

    // Get a v4 signed URL for uploading file
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    return { url, fileName }
  }
)

export const generateUploadThumbnailUrl = onCall(
  { maxInstances: 1 },
  async (request) => {
    // Check if the user is authentication
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated."
      )
    }

    const auth = request.auth
    const data = request.data
    const bucket = storage.bucket(thumbnailBucketName)

    // Generate a unique filename for upload
    const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`

    // Get a v4 signed URL for uploading file
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    return { url, fileName }
  }
)

export const getVideos = onCall({ maxInstances: 1 }, async () => {
  const querySnapshot = await firestore
    .collection(videoCollectionId)
    .limit(30)
    .get()
  return querySnapshot.docs.map((doc) => doc.data())
})

export const saveVideoData = onCall({ maxInstances: 1 }, async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    )
  }

  try {
    const { filename, title, description } = request.data
    const id = filename.split(".")[0]
    const uid = filename.split("-")[0]
    await firestore.collection(videoCollectionId).doc(id).set(
      {
        filename,
        title,
        description,
        id,
        uid,
        thumbnail: "",
      },
      { merge: true }
    )

    return { message: "Video title and description saved successfully." }
  } catch (error) {
    console.error("Error saving video data:", error)
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while saving video data."
    )
  }
})

export const saveThumbnail = onCall({ maxInstances: 1 }, async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    )
  }

  try {
    const { filename, thumbnail } = request.data
    const id = filename.split(".")[0]
    await firestore.collection(videoCollectionId).doc(id).set(
      {
        thumbnail: thumbnail,
      },
      { merge: true }
    )

    return { message: "Thumbnail saved successfully." }
  } catch (error) {
    console.error("Error saving thumbnail:", error)
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while saving video thumbnail."
    )
  }
})
