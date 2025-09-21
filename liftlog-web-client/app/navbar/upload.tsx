"use client"

import { useRouter } from "next/navigation"
import { Button } from "@mantine/core"
import { IconUpload } from "@tabler/icons-react"

export default function Upload() {
  const router = useRouter()

  const handleRedirect = () => {
    router.push("/upload")
  }

  return (
    <Button
      leftSection={<IconUpload size={18} stroke={1.5} />}
      onClick={handleRedirect}
      variant="filled"
      color="blue"
      radius="md"
    >
      Upload Video
    </Button>
  )
}
