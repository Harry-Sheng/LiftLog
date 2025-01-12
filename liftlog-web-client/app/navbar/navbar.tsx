"use client"

import SignIn from "./signIn"
import Link from "next/link"

import styles from "./navbar.module.css"
//import Upload from "./upload"
import { useEffect, useState } from "react"
import { onAuthStateChangedHelper } from "../firebase/firebase"
import { User } from "firebase/auth"
import Upload from "./upload"

function NavBar() {
  // Initialize user state
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  return (
    <nav className={styles.nav}>
      <Link href="/">
        <span className={styles.logoContainer}>
          <img
            className={styles.logo}
            src="/liftlog-logo.svg"
            alt="LiftLog Logo"
          />
        </span>
      </Link>
      {user && <Upload />}
      <SignIn user={user} />
    </nav>
  )
}

export default NavBar
