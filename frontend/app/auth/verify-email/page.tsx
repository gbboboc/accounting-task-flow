import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Building2 } from "lucide-react"
import { AnimatedAuthBackground } from "@/components/animated-auth-background"

export default function VerifyEmailPage() {
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
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Verificați Emailul</CardTitle>
              <CardDescription>V-am trimis un link de verificare</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Vă rugăm să verificați emailul și să dați click pe linkul de verificare pentru a activa contul. După
                verificare, vă puteți autentifica și începe să gestionați sarcinile contabile.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Înapoi la Autentificare</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
