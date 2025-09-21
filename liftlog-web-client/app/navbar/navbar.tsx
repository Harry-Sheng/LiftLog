"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  onAuthStateChangedHelper,
  signInWithGoogle,
  signOut,
} from "../firebase/firebase"

// Mantine + Tabler
import { Button } from "@mantine/core"
import { IconUpload, IconLogout, IconSchool } from "@tabler/icons-react"

export default function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChangedHelper((u) => setUser(u))
    return () => unsub()
  }, [])

  const toggle = () => setIsOpen((v) => !v)

  const goUpload = () => {
    setIsOpen(false)
    router.push("/upload")
  }

  const doSignIn = async () => {
    setIsOpen(false)
    await signInWithGoogle()
  }

  const doSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  return (
    <nav
      className="navbar navbar-expand-md bg-body border-bottom sticky-top"
      role="navigation"
    >
      <div className="container-fluid">
        {/* Logo */}
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <img
            src="/liftlog-logo.svg"
            alt="LiftLog"
            className="me-2"
            style={{ height: 32, width: "auto" }}
          />
          <span className="fw-semibold">LiftLog</span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler"
          type="button"
          aria-expanded={isOpen ? "true" : "false"}
          aria-label="Toggle navigation"
          aria-controls="main-navbar"
          onClick={toggle}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Collapsible content */}
        <div
          id="main-navbar"
          className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
        >
          <div className="ms-auto d-grid gap-2 d-md-flex align-items-md-center py-2 py-md-0">
            {user ? (
              <>
                <Button
                  leftSection={<IconUpload size={18} />}
                  onClick={goUpload}
                  variant="filled"
                  color="blue"
                  radius="md"
                >
                  Upload
                </Button>

                <Button
                  leftSection={<IconLogout size={18} />}
                  onClick={doSignOut}
                  variant="outline"
                  color="gray"
                  radius="md"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  color="gray"
                  radius="md"
                  disabled
                  className="d-inline-flex align-items-center justify-content-center px-3"
                >
                  Sign in to upload
                </Button>

                <Button
                  leftSection={<IconSchool size={18} />}
                  onClick={doSignIn}
                  variant="outline"
                  color="blue"
                  radius="md"
                  className="d-inline-flex align-items-center justify-content-center px-3"
                  style={{ minWidth: "max-content", whiteSpace: "nowrap" }}
                >
                  Log in with UoA
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
