"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ArrowDownCircle, ArrowUpCircle, CreditCard, RefreshCcw } from "lucide-react"

interface CreditHistoryProps {
  userId: string
}

export function CreditHistory({ userId }: CreditHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchTransactions()
  }, [userId])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select(`
          *,
          booking:booking_id(
            id,
            service_id(name)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement de l'historique...</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune transaction à afficher</p>
      </div>
    )
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case "earning":
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />
      case "spending":
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-amber-500" />
      default:
        return <CreditCard className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTransactionLabel = (transaction: any) => {
    switch (transaction.type) {
      case "purchase":
        return "Achat de crédits"
      case "earning":
        return transaction.description || "Gain de crédits"
      case "spending":
        return transaction.booking?.service_id?.name
          ? `Réservation: ${transaction.booking.service_id.name}`
          : transaction.description || "Dépense de crédits"
      case "refund":
        return transaction.description || "Remboursement"
      default:
        return transaction.description || "Transaction"
    }
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-muted p-2">{getTransactionIcon(transaction.type)}</div>
            <div>
              <p className="font-medium">{getTransactionLabel(transaction)}</p>
              <p className="text-sm text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
            {transaction.amount > 0 ? "+" : ""}
            {transaction.amount} crédits
          </div>
        </div>
      ))}
    </div>
  )
}

