"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"

interface MessageListProps {
  userId: string
}

export function MessageList({ userId }: MessageListProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchConversations()
  }, [userId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      // Cette requête est simplifiée - dans une application réelle, vous devriez
      // récupérer les conversations distinctes basées sur les messages envoyés et reçus
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          recipient_id,
          created_at,
          sender:sender_id(full_name, avatar_url),
          recipient:recipient_id(full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      // Regrouper les messages par conversation
      const conversationsMap = new Map()

      if (data) {
        data.forEach((message) => {
          const otherUserId = message.sender_id === userId ? message.recipient_id : message.sender_id
          const otherUser = message.sender_id === userId ? message.recipient : message.sender

          if (!conversationsMap.has(otherUserId)) {
            conversationsMap.set(otherUserId, {
              id: otherUserId,
              user: otherUser,
              lastMessage: message,
            })
          }
        })
      }

      setConversations(Array.from(conversationsMap.values()))

      // Sélectionner la première conversation par défaut
      if (conversationsMap.size > 0 && !selectedConversation) {
        setSelectedConversation(Array.from(conversationsMap.keys())[0])
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Marquer les messages comme lus
      if (data && data.length > 0) {
        const unreadMessages = data.filter((msg) => msg.recipient_id === userId && !msg.read)

        if (unreadMessages.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in(
              "id",
              unreadMessages.map((msg) => msg.id),
            )
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: selectedConversation,
        content: newMessage,
        read: false,
      })

      if (error) throw error

      setNewMessage("")
      fetchMessages(selectedConversation)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement des conversations...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Vous n'avez pas encore de conversations</p>
        <p className="text-sm mt-2">
          Commencez à discuter avec d'autres utilisateurs en réservant un service ou en contactant un prestataire
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 border-b cursor-pointer hover:bg-  => (
          <div
            key={conversation.id}
            className={\`p-4 border-b cursor-pointer hover:bg-muted ${
              selectedConversation === conversation.id ? "bg-muted" : ""
            }`}
            onClick={() => setSelectedConversation(conversation.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={conversation.user?.avatar_url || ""} />
                <AvatarFallback>{conversation.user?.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{conversation.user?.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage?.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Commencez la conversation en envoyant un message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === userId ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Sélectionnez une conversation pour afficher les messages</p>
          </div>
        )}
      </div>
    </div>
  )
}

