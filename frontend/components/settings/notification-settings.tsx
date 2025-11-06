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
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Email Notifications</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_daily_summary">Daily Summary</Label>
                <p className="text-sm text-muted-foreground">Receive a daily summary of tasks at 9:00 AM</p>
              </div>
              <Switch
                id="email_daily_summary"
                checked={formData.email_daily_summary}
                onCheckedChange={(checked) => setFormData({ ...formData, email_daily_summary: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_7days">7 Days Before Deadline</Label>
                <p className="text-sm text-muted-foreground">Get reminded 7 days before a task is due</p>
              </div>
              <Switch
                id="email_task_reminder_7days"
                checked={formData.email_task_reminder_7days}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_7days: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_3days">3 Days Before Deadline</Label>
                <p className="text-sm text-muted-foreground">Get reminded 3 days before a task is due</p>
              </div>
              <Switch
                id="email_task_reminder_3days"
                checked={formData.email_task_reminder_3days}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_3days: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_task_reminder_due">On Due Date</Label>
                <p className="text-sm text-muted-foreground">Get reminded on the day a task is due</p>
              </div>
              <Switch
                id="email_task_reminder_due"
                checked={formData.email_task_reminder_due}
                onCheckedChange={(checked) => setFormData({ ...formData, email_task_reminder_due: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_overdue_tasks">Overdue Tasks</Label>
                <p className="text-sm text-muted-foreground">Daily reminder for overdue tasks</p>
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
            <h3 className="text-lg font-semibold">Push Notifications</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_task_completed">Task Completed</Label>
                <p className="text-sm text-muted-foreground">Notify when a task is marked as completed</p>
              </div>
              <Switch
                id="push_task_completed"
                checked={formData.push_task_completed}
                onCheckedChange={(checked) => setFormData({ ...formData, push_task_completed: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_company_added">New Company Added</Label>
                <p className="text-sm text-muted-foreground">Notify when a new company is added</p>
              </div>
              <Switch
                id="push_company_added"
                checked={formData.push_company_added}
                onCheckedChange={(checked) => setFormData({ ...formData, push_company_added: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_system_updates">System Updates</Label>
                <p className="text-sm text-muted-foreground">Notify about system updates and new features</p>
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
              <p className="text-sm text-success">Preferences saved successfully!</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
