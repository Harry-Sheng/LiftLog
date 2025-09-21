import { httpsCallable } from "firebase/functions"
import { functions } from "./firebase"
import {
  collection,
  getDocs,
  query,
  where,
  limit as qlimit,
  QueryConstraint,
} from "firebase/firestore"
import { db } from "./firebase"

const getVideosFunction = httpsCallable(functions, "getVideos")
const generateUploadUrlFunction = httpsCallable(functions, "generateUploadUrl")
const generateUploadThumbnailUrlFunction = httpsCallable(
  functions,
  "generateUploadThumbnailUrl"
)
const saveThumbnail = httpsCallable(functions, "saveThumbnail")

const saveVideoData = httpsCallable(functions, "saveVideoData")

const getVideoFunction = httpsCallable(functions, "getVideo")

const getFiveVideosFunction = httpsCallable(functions, "getFiveVideos")

type LiftType = "SQUAT" | "BENCH" | "DEADLIFT"
type SexType = "M" | "F"

export interface Video {
  id?: string
  uid?: string
  filename?: string
  status?: "processing" | "processed"
  title?: string
  description?: string
  thumbnail?: string
  userDisplayName?: string
  userPhotoUrl?: string
  date?: string
  liftType: LiftType
  sex: SexType
  weightClass: number
  weightKg: number
}

export interface RowData {
  uid: string
  name: string
  sex: SexType
  weightClass: number
  squatKg: number
  benchKg: number
  deadliftKg: number
  totalKg: number
  video?: {
    squat?: string
    bench?: string
    deadlift?: string
  }
}

type FetchOpts = {
  sex?: "ALL" | SexType
  weightClass?: number
  topN?: number
  includeZeros?: boolean // include users with 0 totals
}

/**
 * Fetch leaderboard rows from Firestore users collection.
 * - Uses user.pbs.* for lifts
 * - Returns sex & weightClass from user doc
 * - bodyweightKg falls back to weightClass if not present
 */
export async function fetchLeaderboardRows(
  opts: FetchOpts = {}
): Promise<RowData[]> {
  const { sex = "ALL", weightClass, topN = 50, includeZeros = false } = opts

  const constraints: QueryConstraint[] = []
  if (sex !== "ALL") constraints.push(where("sex", "==", sex))
  if (typeof weightClass === "number")
    constraints.push(where("weightClass", "==", weightClass))
  if (topN) constraints.push(qlimit(topN))

  const q = constraints.length
    ? query(collection(db, "users"), ...constraints)
    : query(collection(db, "users"), qlimit(topN))

  const snap = await getDocs(q)

  const rows: RowData[] = snap.docs.map((d) => {
    const u = d.data()
    const squat = Number(u?.pbs?.SQUAT?.weightKg ?? 0)
    const bench = Number(u?.pbs?.BENCH?.weightKg ?? 0)
    const dead = Number(u?.pbs?.DEADLIFT?.weightKg ?? 0)
    const total = Number(u?.pbs?.TOTAL?.weightKg ?? squat + bench + dead)

    return {
      uid: u.uid || d.id,
      name: u.displayName || "Anonymous",
      sex: (u.sex as SexType) || "M",
      weightClass: Number(u.weightClass ?? 0),
      bodyweightKg: Number(u.bodyweightKg ?? u.weightClass ?? 0), // fallback
      squatKg: squat,
      benchKg: bench,
      deadliftKg: dead,
      totalKg: total,
      video: {
        squat: u?.pbs?.SQUAT?.videoFilename || "",
        bench: u?.pbs?.BENCH?.videoFilename || "",
        deadlift: u?.pbs?.DEADLIFT?.videoFilename || "",
      },
    }
  })

  return includeZeros ? rows : rows.filter((r) => r.totalKg > 0)
}

export async function uploadVideo(
  file: File,
  image: File,
  title: string,
  description: string,
  liftType: LiftType,
  sex: SexType,
  weightClass: number,
  weightKg: number
) {
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split(".").pop(),
  })

  // Upload the file to the signed URL
  const uploadResult = await fetch(response?.data?.url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  })

  if (uploadResult.ok) {
    await saveVideoData({
      filename: response?.data?.fileName,
      title,
      description,
      liftType,
      sex,
      weightClass,
      weightKg,
    })
  }

  const thumbnailResponse: any = await generateUploadThumbnailUrlFunction({
    fileExtension: image.name.split(".").pop(),
  })

  //upload via the signed url
  const uploadImage = await fetch(thumbnailResponse?.data?.url, {
    method: "Put",
    body: image,
    headers: {
      "Content-Type": image.type,
    },
  })

  if (uploadImage.ok) {
    await saveThumbnail({
      filename: response?.data?.fileName,
      thumbnail: thumbnailResponse?.data?.fileName,
    })
  }

  return uploadResult
}

export async function getVideos() {
  const response: any = await getVideosFunction()
  return response.data as Video[]
}

export async function getVideo(id: string) {
  const response: any = await getVideoFunction({ id })
  return response.data as Video
}

export async function getFiveVideo() {
  const response: any = await getVideosFunction({ limit: 5 })
  return response.data as Video[]
}

export async function getNVideos(n: number) {
  const response: any = await getVideosFunction({ limit: n })
  return response.data as Video[]
}
