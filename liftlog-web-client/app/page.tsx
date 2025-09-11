"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Video, getVideos } from "./firebase/functions"
import { Container, Row, Col, Card, Image, Spinner } from "react-bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import LeaderboardPage from "./leaderboard/page"

export default function Home() {
  const [videos, setVideos] = useState<Video[] | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const fetchedVideos = await getVideos()
        setVideos(fetchedVideos)
      } catch (error) {
        console.error("Error fetching videos:", error)
      }
    }

    fetchVideos()
  }, [])

  const thumbnailPrefix = "https://storage.googleapis.com/liftlog-thumbnails/"

  return (
    <Container>
      <LeaderboardPage></LeaderboardPage>
      <h1 className="mb-4">Recommended Videos</h1>
      {videos ? null : (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
      )}
      <Row>
        {videos &&
          videos.map((video) =>
            video.status === "processed" ? (
              <Col key={video.id} xs={12} sm={6} lg={4} xl={4} className="mb-4">
                <Link
                  href={`/watch?v=${video.filename}`}
                  className=" text-decoration-none"
                  passHref
                >
                  <Card className=" text-decoration-none text-dark">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={
                          `${thumbnailPrefix}${video.thumbnail}` ||
                          "/thumbnail.jpg"
                        }
                        alt={video.title || "Video Thumbnail"}
                        style={{
                          aspectRatio: "16/9",
                          objectFit: "cover",
                        }}
                        className="rounded"
                      />
                    </div>
                    <Card.Body>
                      <div className="d-flex align-items-center mb-2">
                        <Image
                          src={video.userPhotoUrl || "/thumbnail.jpg"}
                          alt={video.userDisplayName || "User Avatar"}
                          roundedCircle
                          width={36}
                          height={36}
                          className="me-2"
                        />
                        <div>
                          <h6 className="mb-0">
                            {video.title || "Untitled Video"}
                          </h6>
                          <small className="text-muted">
                            {video.userDisplayName || "Unknown User"} • {}
                            {video.date || "Unknown Date"}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ) : (
              <Col key={video.id} xs={12} sm={6} lg={4} xl={4} className="mb-4">
                <Card className=" text-decoration-none text-dark">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <Image
                        src={video.userPhotoUrl || "/thumbnail.jpg"}
                        alt={video.userDisplayName || "User Avatar"}
                        roundedCircle
                        width={36}
                        height={36}
                        className="me-2"
                      />
                      <div>
                        <h6 className="mb-0">
                          {"Processing, refresh the page to see the video"}
                        </h6>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          )}
      </Row>
    </Container>
  )
}
