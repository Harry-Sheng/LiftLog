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
const region = "australia-southeast1"

export type LiftType = "SQUAT" | "BENCH" | "DEADLIFT"
export type SexType = "M" | "F"

export interface Video {
  id?: string
  uid?: string
  filename?: string
  status?: "processing" | "processed"
  title?: string
  description?: string
  thumbnailUrl?: string
  userDisplayName?: string
  userPhotoUrl?: string
  date?: string
  liftType: LiftType
  sex: SexType
  weightClass: number
  weightKg: number
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
      displayName: user.displayName || "Anonymous",
      pbs: {
        SQUAT: { weightKg: 0, videoFilename: "" },
        BENCH: { weightKg: 0, videoFilename: "" },
        DEADLIFT: { weightKg: 0, videoFilename: "" },
        TOTAL: { weightKg: 0 },
      },
      sex: "",
      weightClass: 0,
    }

    firestore.collection("users").doc(user.uid).set(userInfo)
    logger.info(`User Created: ${JSON.stringify(userInfo)}`)
    return
  }
)

export const generateUploadUrl = onCall(
  { maxInstances: 1, region: region },
  async (request) => {
    // Check if the user is authentication
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated."
      )
    }

    const { fileExtension, password } = request.data

    // Check password
    const expectedPassword = process.env.UPLOAD_PASSWORD
    if (!password || password !== expectedPassword) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Invalid upload password."
      )
    }

    const auth = request.auth
    const bucket = storage.bucket(rawVideoBucketName)

    // Generate a unique filename for upload
    const fileName = `${auth.uid}-${Date.now()}.${fileExtension}`

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
  { maxInstances: 1, region: region },
  async (request) => {
    // Check if the user is authentication
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated."
      )
    }

    const { fileExtension, password } = request.data

    // Check password
    const expectedPassword = process.env.UPLOAD_PASSWORD
    if (!password || password !== expectedPassword) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Invalid upload password."
      )
    }
    const auth = request.auth
    const bucket = storage.bucket(thumbnailBucketName)

    // Generate a unique filename for upload
    const fileName = `${auth.uid}-${Date.now()}.${fileExtension}`

    // Get a v4 signed URL for uploading file
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    return { url, fileName }
  }
)

export const getVideos = onCall(
  { maxInstances: 1, region },
  async (request) => {
    const limit = request.data?.limit ?? 35
    const querySnapshot = await firestore
      .collection(videoCollectionId)
      .limit(limit)
      .get()
    return querySnapshot.docs.map((doc) => doc.data())
  }
)


export const getVideo = onCall(
  { maxInstances: 1, region: region },
  async (request) => {
    const id = request.data.id
    const doc = await firestore.collection(videoCollectionId).doc(id).get()
    return doc.data()
  }
)

export const saveVideoData = onCall(
  { maxInstances: 1, region: region },
  async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated."
      )
    }

    try {
      const {
        filename,
        title,
        description,
        liftType,
        sex,
        weightClass,
        weightKg,
      } = request.data

      // ---- basic validation ----
      if (!filename || !liftType || typeof weightKg !== "number") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "filename, liftType and weightKg are required."
        )
      }

      const id = filename.split(".")[0]
      const uid = filename.split("-")[0]
      const user = await getUserInfo(uid)
      const timestamp = Number.parseInt(id?.split("-")[1] ?? "", 10)
      const date = new Date(timestamp).toLocaleDateString("en-NZ")

      // save video
      await firestore
        .collection(videoCollectionId)
        .doc(id)
        .set(
          {
            filename,
            title,
            description,
            id,
            uid,
            thumbnail: "",
            userDisplayName: user?.displayName,
            userPhotoUrl: user?.photoUrl ?? "",
            date,
            liftType,
            sex,
            weightClass,
            weightKg,
          },
          { merge: true }
        )

      // 2) PB check for THIS liftType only, then update TOTAL
      const userRef = firestore.collection("users").doc(uid)
      const userSnap = await userRef.get()

      // defaults to avoid undefineds
      const pbs =
        userSnap.exists && (userSnap.data() as any)?.pbs ?
          (userSnap.data() as any).pbs :
          {
            SQUAT: { weightKg: 0, videoFilename: "" },
            BENCH: { weightKg: 0, videoFilename: "" },
            DEADLIFT: { weightKg: 0, videoFilename: "" },
            TOTAL: { weightKg: 0 },
          }

      const prev = Number(pbs?.[liftType]?.weightKg ?? 0)
      const isPB = weightKg > prev

      if (isPB) {
        // compute new total using updated current lift and existing others
        const s =
          liftType === "SQUAT" ? weightKg : Number(pbs.SQUAT?.weightKg ?? 0)
        const b =
          liftType === "BENCH" ? weightKg : Number(pbs.BENCH?.weightKg ?? 0)
        const d =
          liftType === "DEADLIFT" ?
            weightKg :
            Number(pbs.DEADLIFT?.weightKg ?? 0)
        const total = s + b + d

        // update ONLY the changed PB fields + TOTAL (dot-paths)
        await userRef.update({
          [`pbs.${liftType}.weightKg`]: weightKg,
          [`pbs.${liftType}.videoFilename`]: filename,
          "pbs.TOTAL.weightKg": total,
          ...(sex ? { sex } : {}),
          ...(typeof weightClass === "number" ? { weightClass } : {}),
        })
      }

      return { message: "Video title and description saved successfully." }
    } catch (error) {
      console.error("Error saving video data:", error)
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while saving video data."
      )
    }
  }
)

export const saveThumbnail = onCall(
  { maxInstances: 1, region: region },
  async (request) => {
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
  }
)

export const getUserInfo = async (uid: string) => {
  let userInfo
  try {
    userInfo = await firestore.collection("users").doc(uid).get()
  } catch (error) {
    console.error("Error getting user info:", error)
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while getting user info."
    )
  }
  return userInfo.data()
}
