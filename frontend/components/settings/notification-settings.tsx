"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { NotificationPreferences } from "@/lib/types"

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null
  userId: string
}

export function NotificationSettings({ preferences, userId }: NotificationSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email_daily_summary: preferences?.email_daily_summary ?? true,
    email_task_reminder_7days: preferences?.email_task_reminder_7days ?? true,
    email_task_reminder_3days: preferences?.email_task_reminder_3days ?? true,
    email_task_reminder_1day: preferences?.email_task_reminder_1day ?? true,
    email_task_reminder_due: preferences?.email_task_reminder_due ?? true,
    email_overdue_tasks: preferences?.email_overdue_tasks ?? true,
    push_task_completed: preferences?.push_task_completed ?? true,
    push_company_added: preferences?.push_company_added ?? true,
    push_system_updates: preferences?.push_system_updates ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      if (preferences) {
        // Update existing preferences
        const { error: updateError } = await supabase
          .from("notification_preferences")
          .update(formData)
          .eq("user_id", userId)

        if (updateError) throw updateError
      } else {
        // Create new preferences
        const { error: insertError } = await supabase.from("notification_preferences").insert({
          user_id: userId,
          ...formData,
        })

        if (insertError) throw insertError
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferințe Notificări</CardTitle>
        <CardDescription>Gestionați modul și momentul când primiți notificări</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notificări Email</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_daily_summary">Rezumat Zilnic</Label>
                <p className="text-sm text-muted-foreground">Primiți un rezumat zilnic al sarcinilor la ora 9:00</p>
              </div>
              <Switch
                id="email_daily_summary"
                checked={formData.email_daily_summary}
                onCheckedChange={(checked) => setFormData({ ...formData, email_daily_summary: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_7days">7 Zile Înainte de Scadență</Label>
                <p className="text-sm text-muted-foreground">Primiți reamintire cu 7 zile înainte ca o sarcină să fie scadentă</p>
              </div>
              <Switch
                id="email_task_reminder_7days"
                checked={formData.email_task_reminder_7days}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_7days: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_3days">3 Zile Înainte de Scadență</Label>
                <p className="text-sm text-muted-foreground">Primiți reamintire cu 3 zile înainte ca o sarcină să fie scadentă</p>
              </div>
              <Switch
                id="email_task_reminder_3days"
                checked={formData.email_task_reminder_3days}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_3days: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_1day">1 Zi Înainte de Scadență</Label>
                <p className="text-sm text-muted-foreground">Primiți reamintire cu 1 zi înainte ca o sarcină să fie scadentă</p>
              </div>
              <Switch
                id="email_task_reminder_1day"
                checked={formData.email_task_reminder_1day}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_1day: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_due">În Ziua Scadenței</Label>
                <p className="text-sm text-muted-foreground">Primiți reamintire în ziua când o sarcină este scadentă</p>
              </div>
              <Switch
                id="email_task_reminder_due"
                checked={formData.email_task_reminder_due}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_due: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_overdue_tasks">Sarcini Întârziate</Label>
                <p className="text-sm text-muted-foreground">Reamintire zilnică pentru sarcinile întârziate</p>
              </div>
              <Switch
                id="email_overdue_tasks"
                checked={formData.email_overdue_tasks}
                onCheckedChange={(checked) => setFormData({ ...formData, email_overdue_tasks: checked })}
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notificări Push</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_task_completed">Sarcină Finalizată</Label>
                <p className="text-sm text-muted-foreground">Notificare când o sarcină este marcată ca finalizată</p>
              </div>
              <Switch
                id="push_task_completed"
                checked={formData.push_task_completed}
                onCheckedChange={(checked) => setFormData({ ...formData, push_task_completed: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_company_added">Companie Nouă Adăugată</Label>
                <p className="text-sm text-muted-foreground">Notificare când o companie nouă este adăugată</p>
              </div>
              <Switch
                id="push_company_added"
                checked={formData.push_company_added}
                onCheckedChange={(checked) => setFormData({ ...formData, push_company_added: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_system_updates">Actualizări Sistem</Label>
                <p className="text-sm text-muted-foreground">Notificare despre actualizările sistemului și funcții noi</p>
              </div>
              <Switch
                id="push_system_updates"
                checked={formData.push_system_updates}
                onCheckedChange={(checked) => setFormData({ ...formData, push_system_updates: checked })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-success">Preferințele au fost salvate cu succes!</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Se salvează..." : "Salvează Preferințele"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
