"use client"

import { Suspense, use } from "react"
import { useSearchParams } from "next/navigation"
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Image,
  Spinner,
} from "react-bootstrap"
import Link from "next/link"
import { Video, getVideo, getFiveVideo } from "../firebase/functions"
import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react"

export default function Watch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchContent />
    </Suspense>
  )
}

function WatchContent() {
  const [video, setVideo] = useState<Video | null>(null)
  const [videos, setVideos] = useState<Video[] | null>(null)
  const searchParams = useSearchParams()
  const videoPrefix = "https://storage.googleapis.com/liftlog-processed-videos/"
  const thumbnailPrefix = "https://storage.googleapis.com/liftlog-thumbnails/"
  const videoSrc = searchParams.get("v")
  const id = videoSrc?.split(".")[0].replace("processed-", "") ?? ""

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const video = await getVideo(id)
        setVideo(video)
        const fetchedFiveVideos = await getFiveVideo()
        setVideos(fetchedFiveVideos)
        console.log(fetchedFiveVideos)
      } catch (error) {
        console.error("Error fetching video:", error)
      }
    }

    if (id) {
      fetchVideo()
    }
  }, [id])

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          {/* Video Player */}
          <div className="mb-4 bg-dark rounded shadow">
            <video
              className="img-fluid d-block mx-auto"
              style={{ maxHeight: "700px" }}
              controls
              src={videoSrc ? `${videoPrefix}${videoSrc}` : ""}
            />
          </div>
          {/* Video Title */}
          <h1 className="mb-2">{video ? video?.title : "loading title..."}</h1>

          {/* Video Metadata */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <p className="text-muted mb-0">{video?.date || "Unknown Date"}</p>
          </div>

          <hr className="my-4" />

          {/* Channel Information */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <Image
                src={video?.userPhotoUrl || "/thumbnail.png"}
                alt={video?.userDisplayName || "User Avatar"}
                roundedCircle
                width={40}
                height={40}
                className="me-2"
              />
              <h5 className="mb-0">{video?.userDisplayName}</h5>
            </div>
          </div>

          {/* Video Description */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Text>
                {video ? video?.description : "loading description..."}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Recommended Videos Sidebar */}
        <Col lg={4}>
          <h4 className="mb-4">
            {videos ? "Recommended Videos" : <p>Loading...</p>}{" "}
          </h4>
          {videos ? (
            videos.map((video, index) => (
              <Link
                href={`/watch?v=${video.filename}`}
                key={index}
                className=" text-decoration-none"
                passHref
              >
                <div className="d-flex align-items-center mb-2">
                  <Image
                    src={`${thumbnailPrefix}${video.thumbnail}`}
                    width={100}
                    height={100}
                    className="rounded me-3"
                  />
                  <div>
                    <h6 className="mb-1">{video.title}</h6>
                    <p className="text-muted mb-0">{video.userDisplayName}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          )}
        </Col>
      </Row>
    </Container>
  )
}
