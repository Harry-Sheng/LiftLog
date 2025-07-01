import { httpsCallable } from "firebase/functions"
import { functions } from "./firebase"

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
}

export async function uploadVideo(
  file: File,
  image: File,
  title: string,
  description: string,
  password: string
) {
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split(".").pop(),
    password,
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
    })
  }

  const thumbnailResponse: any = await generateUploadThumbnailUrlFunction({
    fileExtension: image.name.split(".").pop(),
    password,
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
  const response: any = await getFiveVideosFunction()
  return response.data as Video[]
}
