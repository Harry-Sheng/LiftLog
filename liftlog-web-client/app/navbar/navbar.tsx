"use client"

import SignIn from "./signIn"
import Link from "next/link"
import styles from "./navbar.module.css"
import { useEffect, useState } from "react"
import { onAuthStateChangedHelper } from "../firebase/firebase"
import { User } from "firebase/auth"
import Upload from "./upload"
import { Text } from "@mantine/core"

function NavBar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  return (
    <nav className={styles.nav}>
      {/* Left side: logo */}
      <Link href="/">
        <span className={styles.logoContainer}>
          <img
            className={styles.logo}
            src="/liftlog-logo.svg"
            alt="LiftLog Logo"
          />
        </span>
      </Link>

      {/* Right side: controls */}
      <div className={styles.rightControls}>
        {user ? (
          <>
            <Upload />
            <SignIn user={user} />
          </>
        ) : (
          <>
            <Text size="sm" c="dimmed" mr="md">
              Sign in to upload
            </Text>
            <SignIn user={null} />
          </>
        )}
      </div>
    </nav>
  )
}

export default NavBar
