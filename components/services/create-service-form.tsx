"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import Image from "next/image"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CreateServiceFormProps {
  categories: Category[]
}

export function CreateServiceForm({ categories }: CreateServiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    credits_per_hour: 10,
    location: "",
    expertise_level: "",
    remote_available: false,
    in_person_available: false,
    available_days: [] as string[],
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      available_days: checked ? [...prev.available_days, value] : prev.available_days.filter((day) => day !== value),
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImage(file)

      // Créer un aperçu de l'image
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Vérifier si l'utilisateur est connecté
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Vous devez être connecté pour proposer un service")
      }

      let imageUrl = null

      // Uploader l'image si elle existe
      if (image) {
        try {
          const fileExt = image.name.split(".").pop()
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `services/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("service-images")
            .upload(filePath, image)

          if (uploadError) {
            throw uploadError
          }

          // Obtenir l'URL publique de l'image
          const { data: publicUrlData } = supabase.storage.from("service-images").getPublicUrl(filePath)

          imageUrl = publicUrlData.publicUrl
        } catch (uploadError) {
          console.error("Erreur lors du téléchargement de l'image:", uploadError)
          // Continuer sans image
        }
      }

      // Créer le service
      const { data, error } = await supabase
        .from("services")
        .insert({
          name: formData.name,
          description: formData.description,
          provider_id: session.user.id,
          category_id: formData.category_id || null,
          credits_per_hour: formData.credits_per_hour,
          location: formData.location || null,
          expertise_level: formData.expertise_level || null,
          remote_available: formData.remote_available,
          in_person_available: formData.in_person_available,
          status: "pending",
          available_days: formData.available_days.length > 0 ? formData.available_days : null,
          image_url: imageUrl,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toast({
        title: "Service créé avec succès",
        description: "Votre service a été soumis et est en attente de validation",
      })

      router.push("/dashboard/my-services")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur lors de la création du service",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom du service</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Cours de guitare, Aide au jardinage..."
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Catégorie</Label>
          <select
            id="category"
            name="category_id"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description détaillée</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Décrivez votre service, vos compétences, et ce que les utilisateurs peuvent attendre..."
            rows={5}
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="expertise">Niveau d'expertise</Label>
          <select
            id="expertise"
            name="expertise_level"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.expertise_level}
            onChange={handleChange}
          >
            <option value="">Sélectionnez un niveau</option>
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Mode de prestation</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remote"
                name="remote_available"
                className="h-4 w-4 rounded border-gray-300"
                checked={formData.remote_available}
                onChange={handleCheckboxChange}
              />
              <Label htmlFor="remote">À distance</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="in-person"
                name="in_person_available"
                className="h-4 w-4 rounded border-gray-300"
                checked={formData.in_person_available}
                onChange={handleCheckboxChange}
              />
              <Label htmlFor="in-person">En personne</Label>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Localisation (si en personne)</Label>
          <Input
            id="location"
            name="location"
            placeholder="Ville, Code postal..."
            value={formData.location}
            onChange={handleChange}
            disabled={!formData.in_person_available}
          />
        </div>

        <div className="grid gap-2">
          <Label>Disponibilité</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={day.toLowerCase()}
                  value={day}
                  className="h-4 w-4 rounded border-gray-300"
                  checked={formData.available_days.includes(day)}
                  onChange={handleDayChange}
                />
                <Label htmlFor={day.toLowerCase()}>{day}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="credits">Crédits demandés (par heure)</Label>
          <Input
            id="credits"
            name="credits_per_hour"
            type="number"
            min="1"
            placeholder="10"
            value={formData.credits_per_hour}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="image">Image du service</Label>
          <Input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Aperçu de l'image:</p>
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <Image src={imagePreview || "/placeholder.svg"} alt="Aperçu" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Publication en cours..." : "Publier le service"}
        </Button>
      </div>
    </form>
  )
}

