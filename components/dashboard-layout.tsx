"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  ShoppingBag,
  User,
  Bell,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, isLoading } = useUser()
  const supabase = getSupabaseClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message || "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      })
    }
  }

  const routes = [
    {
      label: "Tableau de bord",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Proposer un service",
      icon: PlusCircle,
      href: "/dashboard/create-service",
      active: pathname === "/dashboard/create-service",
    },
    {
      label: "Consulter les services",
      icon: ShoppingBag,
      href: "/dashboard/services",
      active: pathname === "/dashboard/services" || pathname.startsWith("/dashboard/services/"),
    },
    {
      label: "Mes services",
      icon: Clock,
      href: "/dashboard/my-services",
      active: pathname === "/dashboard/my-services",
      show: user?.user_type === "provider" || user?.user_type === "both",
    },
    {
      label: "Réservations",
      icon: Calendar,
      href: "/dashboard/bookings",
      active: pathname === "/dashboard/bookings",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/dashboard/messages",
      active: pathname === "/dashboard/messages",
    },
    {
      label: "Crédits",
      icon: CreditCard,
      href: "/dashboard/credits",
      active: pathname === "/dashboard/credits",
    },
    {
      label: "Paramètres",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
    {
      label: "Administration",
      icon: ShieldAlert,
      href: "/dashboard/admin",
      active: pathname === "/dashboard/admin",
      show: user?.user_type === "admin",
    },
    {
      label: "Modération",
      icon: ShieldAlert,
      href: "/dashboard/moderation",
      active: pathname === "/dashboard/moderation",
      show: user?.user_type === "admin",
    },
  ]

  // Filtrer les routes en fonction du type d'utilisateur
  const filteredRoutes = routes.filter((route) => route.show === undefined || route.show === true)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <ShoppingBag className="h-6 w-6" />
                  <span>TrocSkill</span>
                </Link>
              </div>
              <nav className="grid gap-2 p-4">
                {filteredRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                      route.active ? "bg-muted font-medium text-primary" : "text-muted-foreground",
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t">
                <Button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:text-lg">
          <ShoppingBag className="h-6 w-6" />
          <span>TrocSkill</span>
        </Link>
        <div className="relative ml-auto flex-1 md:grow-0 md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Rechercher..." className="w-full rounded-lg bg-background pl-8 md:w-80" />
        </div>
        <Button variant="ghost" size="icon" className="ml-auto md:hidden">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/dashboard/settings">
            {isLoading ? (
              <User className="h-5 w-5" />
            ) : (
              <Avatar>
                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "Utilisateur"} />
                <AvatarFallback>
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="sr-only">Profile</span>
          </Link>
        </Button>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <nav className="flex flex-col h-full">
            <div className="flex-1 grid gap-2 p-4">
              {filteredRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                    route.active ? "bg-background font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t">
              <Button
                onClick={handleSignOut}
                className="w-full flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

