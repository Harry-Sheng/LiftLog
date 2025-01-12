"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

export default function Watch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchContent />
    </Suspense>
  )
}

function WatchContent() {
  const searchParams = useSearchParams()
  const videoPrefix = "https://storage.googleapis.com/liftlog-processed-videos/"
  const videoSrc = searchParams.get("v")

  return (
    <div>
      <h1>Watch Page</h1>
      <video controls src={`${videoPrefix}${videoSrc}`} />
    </div>
  )
}
