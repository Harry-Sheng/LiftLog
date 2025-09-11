"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Form, Button, Spinner } from "react-bootstrap"
import { uploadVideo } from "../app/firebase/functions"
import { FirebaseError } from "firebase/app"
import "bootstrap/dist/css/bootstrap.min.css"

type LiftType = "SQUAT" | "BENCH" | "DEADLIFT"
type SexType = "M" | "F"

export default function VideoUploadForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [video, setVideo] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [password, setPassword] = useState("")
  const [liftType, setLiftType] = useState<LiftType>("SQUAT")
  const [sex, setSex] = useState<SexType>("M")
  const [weightClass, setWeightClass] = useState<number>(83)
  const [weightKg, setWeightKg] = useState<number>(100)
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
      await uploadVideo(
        video,
        thumbnail,
        title,
        description,
        password,
        liftType,
        sex,
        weightClass,
        weightKg
      )
      router.push("/")
    } catch (error) {
      console.error("Full error object:", error)

      if (error instanceof FirebaseError) {
        if (error.code === "functions/permission-denied") {
          alert("Upload failed: Invalid password.")
        } else if (error.code === "functions/failed-precondition") {
          alert("Upload failed: You must be signed in.")
        } else {
          alert("Upload failed: " + error.message)
        }
      } else {
        alert("Upload failed: Unexpected error.")
      }
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

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        {/* Lift details */}
        <Form.Group className="mb-3" controlId="liftType">
          <Form.Label>Lift</Form.Label>
          <Form.Select
            value={liftType}
            onChange={(e) => setLiftType(e.target.value as LiftType)}
            required
          >
            <option value="SQUAT">Squat</option>
            <option value="BENCH">Bench</option>
            <option value="DEADLIFT">Deadlift</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="sex">
          <Form.Label>Sex</Form.Label>
          <Form.Select
            value={sex}
            onChange={(e) => setSex(e.target.value as SexType)}
            required
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="weightClass">
          <Form.Label>Weight Class (kg)</Form.Label>
          <Form.Control
            type="number"
            inputMode="numeric"
            min={30}
            step={1}
            value={weightClass}
            onChange={(e) => setWeightClass(Number(e.target.value))}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="weightKg">
          <Form.Label>Lift Weight (kg)</Form.Label>
          <Form.Control
            type="number"
            inputMode="decimal"
            min={1}
            step={0.5}
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
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
