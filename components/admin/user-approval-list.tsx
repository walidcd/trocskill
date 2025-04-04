"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getPendingUsers, approveUser, rejectUser } from "@/lib/admin-actions"
import { Check, X, Mail, Calendar } from "lucide-react"

export function UserApprovalList() {
  const [isLoading, setIsLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userToReject, setUserToReject] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    setIsLoading(true)

    try {
      const users = await getPendingUsers()
      setPendingUsers(users)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du chargement des utilisateurs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUser(userId)

      toast({
        title: "Utilisateur approuvé",
        description: "L'utilisateur a été approuvé avec succès",
      })

      // Recharger la liste des utilisateurs en attente
      loadPendingUsers()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const openRejectDialog = (userId: string) => {
    setUserToReject(userId)
    setRejectReason("")
    setIsDialogOpen(true)
  }

  const handleRejectUser = async () => {
    if (!userToReject) return

    try {
      await rejectUser(userToReject, rejectReason || "Aucune raison spécifiée")

      toast({
        title: "Utilisateur refusé",
        description: "L'utilisateur a été refusé avec succès",
      })

      // Fermer la boîte de dialogue
      setIsDialogOpen(false)
      setUserToReject(null)
      setRejectReason("")

      // Recharger la liste des utilisateurs en attente
      loadPendingUsers()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chargement des utilisateurs en attente...</p>
      </div>
    )
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun utilisateur en attente d'approbation</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pendingUsers.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold">{user.full_name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-1 h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  Inscrit le {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="mt-1">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {user.user_type === "provider"
                      ? "Fournisseur"
                      : user.user_type === "consumer"
                        ? "Consommateur"
                        : user.user_type === "both"
                          ? "Les deux"
                          : user.user_type}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveUser(user.id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openRejectDialog(user.id)}>
                    <X className="mr-2 h-4 w-4" />
                    Refuser
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser l'utilisateur</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus. L'utilisateur sera supprimé du système.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Raison du refus</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi cet utilisateur est refusé..."
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
            <Button variant="destructive" onClick={handleRejectUser}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

