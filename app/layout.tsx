import type React from "react"
import { Toaster } from "@/components/toaster"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TrocSkill - Échangez vos compétences",
  description: "Plateforme d'échange de services et compétences",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}



import './globals.css'