"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ProfileFormProps {
  userData: any
}

export function ProfileForm({ userData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: userData?.full_name || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    location: userData?.location || "",
    bio: userData?.bio || "",
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userData?.avatar_url || null)

  const supabase = getSupabaseClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatar(file)

      // Créer un aperçu de l'image
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let avatarUrl = userData?.avatar_url

      // Uploader l'avatar si un nouveau fichier est sélectionné
      if (avatar) {
        try {
          const fileExt = avatar.name.split(".").pop()
          const fileName = `${userData.id}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatar, { upsert: true })

          if (uploadError) {
            throw uploadError
          }

          // Obtenir l'URL publique de l'image
          const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

          avatarUrl = publicUrlData.publicUrl
        } catch (uploadError) {
          console.error("Erreur lors du téléchargement de l'avatar:", uploadError)
          // Continuer sans changer l'avatar
        }
      }

      // Mettre à jour le profil
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id)

      if (error) {
        throw error
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="full_name" value={formData.full_name} onChange={handleChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} disabled />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Localisation</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatar">Photo de profil</Label>
              <div className="flex items-center gap-4">
                {avatarPreview && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image src={avatarPreview || "/placeholder.svg"} alt="Avatar" fill className="object-cover" />
                  </div>
                )}
                <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

