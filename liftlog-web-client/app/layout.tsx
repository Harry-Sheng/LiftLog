import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import "./globals.css"
import Navbar from "./navbar/navbar"

const inter = Inter({ subsets: ["latin"] })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LiftLog",
  description: "Share your workouts with the world",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable}`}
      >
        <MantineProvider defaultColorScheme="light">
          <Navbar />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
