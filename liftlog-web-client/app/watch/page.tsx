"use client"

import { useSearchParams } from "next/navigation"

export default function Watch() {
  const searchParams = useSearchParams()
  const videoPrefix = "https://storage.googleapis.com/liftlog-processed-videos/"
  const videoSrc = searchParams.get("v")
  console.log(`${videoPrefix}${videoSrc}`)
  return (
    <div>
      <h1>Watch Page</h1>
      {<video controls src={`${videoPrefix}${videoSrc}`} />}
    </div>
  )
}
