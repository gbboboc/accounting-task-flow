"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Building2, ArrowLeft } from "lucide-react"
import { AnimatedAuthBackground } from "@/components/animated-auth-background"
import { getAuthRedirectUrl } from "@/lib/utils/auth-redirect"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl("/auth/reset-password"),
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <AnimatedAuthBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-6">
          {/* Logo and branding */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">TaskFlow Contabilitate</h1>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Resetare Parolă</CardTitle>
              <CardDescription>Introduceți emailul pentru a primi link de resetare</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <div className="p-4 text-sm text-success bg-green-50 border border-green-200 rounded-lg">
                    Verificați emailul pentru linkul de resetare a parolei.
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/auth/login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Înapoi la Autentificare
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplu.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-lg">{error}</div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? "Se trimite..." : "Trimite Link Resetare"}
                    </Button>

                    <Button asChild variant="ghost" className="w-full">
                      <Link href="/auth/login">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Înapoi la Autentificare
                      </Link>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
