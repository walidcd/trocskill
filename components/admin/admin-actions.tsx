"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { seedCategories } from "@/lib/seed-categories"
import { promoteToAdmin, getPendingServices, approveService, rejectService } from "@/lib/admin-actions"
import { createAdminUser } from "@/lib/create-admin"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

export function AdminActions() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)
  const [userId, setUserId] = useState("")
  const [pendingServices, setPendingServices] = useState<any[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [serviceToReject, setServiceToReject] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string } | null>(null)

  const handleSeedCategories = async () => {
    setIsLoading(true)

    try {
      const result = await seedCategories()

      toast({
        title: "Catégories initialisées",
        description: result.message,
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    setIsCreatingAdmin(true)

    try {
      const result = await createAdminUser()

      if (result.credentials) {
        setAdminCredentials(result.credentials)

        toast({
          title: "Administrateur créé",
          description: `Un compte administrateur a été créé avec succès. Notez les identifiants affichés.`,
        })
      } else {
        toast({
          title: "Information",
          description: result.message,
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  const handlePromoteToAdmin = async () => {
    if (!userId) {
      toast({
        title: "ID utilisateur requis",
        description: "Veuillez entrer l'ID de l'utilisateur à promouvoir",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await promoteToAdmin(userId)

      toast({
        title: "Utilisateur promu",
        description: `L'utilisateur a été promu au statut d'administrateur`,
      })

      setUserId("")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPendingServices = async () => {
    setIsLoadingServices(true)

    try {
      const services = await getPendingServices()
      setPendingServices(services)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du chargement des services",
        variant: "destructive",
      })
    } finally {
      setIsLoadingServices(false)
    }
  }

  const handleApproveService = async (serviceId: string) => {
    try {
      await approveService(serviceId)

      toast({
        title: "Service approuvé",
        description: "Le service a été approuvé avec succès",
      })

      // Recharger la liste des services en attente
      loadPendingServices()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const openRejectDialog = (serviceId: string) => {
    setServiceToReject(serviceId)
    setRejectReason("")
    setIsDialogOpen(true)
  }

  const handleRejectService = async () => {
    if (!serviceToReject) return

    try {
      await rejectService(serviceToReject, rejectReason || "Aucune raison spécifiée")

      toast({
        title: "Service refusé",
        description: "Le service a été refusé avec succès",
      })

      // Fermer la boîte de dialogue
      setIsDialogOpen(false)
      setServiceToReject(null)
      setRejectReason("")

      // Recharger la liste des services en attente
      loadPendingServices()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services" onClick={loadPendingServices}>
            Services en attente
          </TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Services en attente d'approbation</h3>
            <Button variant="outline" onClick={loadPendingServices} disabled={isLoadingServices}>
              {isLoadingServices ? "Chargement..." : "Actualiser"}
            </Button>
          </div>

          {isLoadingServices ? (
            <div className="text-center py-8">Chargement des services...</div>
          ) : pendingServices.length > 0 ? (
            <div className="space-y-4">
              {pendingServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Par {service.provider.full_name} ({service.provider.email})
                        </p>
                        <p className="text-sm mt-2">{service.description}</p>
                        <div className="flex items-center gap-4 text-sm mt-2">
                          <span className="font-medium">{service.credits_per_hour} crédits/h</span>
                          <span className="text-muted-foreground">
                            Créé le {new Date(service.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveService(service.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approuver
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openRejectDialog(service.id)}>
                            <X className="mr-2 h-4 w-4" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun service en attente d'approbation</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Initialisation des catégories</h3>
            <p className="text-sm text-muted-foreground">
              Utilisez cet outil pour initialiser les catégories de services
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Catégories</h4>
            <p className="text-sm text-muted-foreground mb-4">Initialiser les catégories de services</p>
            <Button onClick={handleSeedCategories} disabled={isLoading}>
              {isLoading ? "Initialisation..." : "Initialiser les catégories"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Gestion des utilisateurs</h3>
            <p className="text-sm text-muted-foreground">Outils pour gérer les utilisateurs de la plateforme</p>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Créer un compte administrateur</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Créer un compte administrateur avec des identifiants par défaut
            </p>
            <Button onClick={handleCreateAdmin} disabled={isCreatingAdmin}>
              {isCreatingAdmin ? "Création..." : "Créer un administrateur"}
            </Button>

            {adminCredentials && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="font-medium text-yellow-800 mb-2">Identifiants administrateur</h5>
                <p className="text-sm mb-1">
                  <strong>Email:</strong> {adminCredentials.email}
                </p>
                <p className="text-sm mb-2">
                  <strong>Mot de passe:</strong> {adminCredentials.password}
                </p>
                <p className="text-xs text-yellow-700">Notez ces identifiants, ils ne seront plus affichés.</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Promouvoir un utilisateur en administrateur</h4>
            <p className="text-sm text-muted-foreground mb-4">Entrez l'ID de l'utilisateur à promouvoir</p>
            <div className="flex gap-2">
              <Input placeholder="ID de l'utilisateur" value={userId} onChange={(e) => setUserId(e.target.value)} />
              <Button onClick={handlePromoteToAdmin} disabled={isLoading || !userId}>
                {isLoading ? "Promotion..." : "Promouvoir"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le service</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus. Cette information sera envoyée au fournisseur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Raison du refus</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi ce service est refusé..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectService}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

