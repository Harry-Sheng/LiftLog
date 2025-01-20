"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Form, Button, Spinner } from "react-bootstrap"
import { uploadVideo } from "../app/firebase/functions"
import "bootstrap/dist/css/bootstrap.min.css"

export default function VideoUploadForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [video, setVideo] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handelVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0)
    if (file) {
      setVideo(file)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0)
    if (file) {
      setThumbnail(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !video || !thumbnail) {
      alert("Please fill in all fields and select both a video and thumbnail.")
      return
    }

    setIsUploading(true)

    try {
      await uploadVideo(video)
      router.push("/")
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Form
        onSubmit={handleSubmit}
        className="p-4 border rounded shadow-sm bg-light"
        style={{ margin: "auto" }}
      >
        <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
        <Form.Group className="mb-3" controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="video">
          <Form.Label>Video</Form.Label>
          <Form.Control
            type="file"
            accept="video/*"
            onChange={handelVideoChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="thumbnail">
          <Form.Label>Thumbnail</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            required
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          disabled={isUploading}
          className="w-100"
        >
          {isUploading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{" "}
              Uploading...
            </>
          ) : (
            "Upload Video"
          )}
        </Button>
      </Form>
    </>
  )
}
