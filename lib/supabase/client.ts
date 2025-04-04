"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// Créer un singleton pour éviter de multiples instances
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      },
    })
  }
  return supabaseClient
}

