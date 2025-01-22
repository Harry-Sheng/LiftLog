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
}

export async function uploadVideo(
  file: File,
  image: File,
  title: string,
  description: string
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
