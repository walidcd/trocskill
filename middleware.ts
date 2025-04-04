import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
    if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/"
      redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Si l'utilisateur est connecté
    if (session) {
      try {
        // Vérifier si l'utilisateur est approuvé
        const { data: userData, error } = await supabase
          .from("users")
          .select("status, user_type")
          .eq("id", session.user.id)
          .single()

        // Si l'utilisateur n'est pas approuvé et essaie d'accéder au dashboard
        if (userData?.status === "pending" && req.nextUrl.pathname.startsWith("/dashboard")) {
          // Déconnecter l'utilisateur
          await supabase.auth.signOut()

          // Rediriger vers la page de connexion avec un message
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = "/"
          redirectUrl.searchParams.set("error", "pending_approval")
          return NextResponse.redirect(redirectUrl)
        }

        // Si l'utilisateur n'est pas admin et essaie d'accéder aux pages d'administration
        if (
          userData?.user_type !== "admin" &&
          (req.nextUrl.pathname.startsWith("/dashboard/admin") ||
            req.nextUrl.pathname.startsWith("/dashboard/moderation"))
        ) {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }

        // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
        if (req.nextUrl.pathname === "/") {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error)
        // En cas d'erreur, on laisse passer la requête
      }
    }

    return res
  } catch (error) {
    console.error("Erreur d'authentification dans le middleware:", error)
    // En cas d'erreur d'authentification, on supprime les cookies et on redirige vers la page d'accueil
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/"
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

