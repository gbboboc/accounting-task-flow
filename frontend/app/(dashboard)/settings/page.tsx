import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { TaskTemplatesSettings } from "@/components/settings/task-templates-settings"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch notification preferences
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Fetch task templates
  const { data: templates } = await supabase.from("task_templates").select("*").order("name")

  return (
    <div className="space-y-8 max-w-4xl">
      <DashboardHeader title="Setări" description="Gestionați setările contului și preferințele" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notificări</TabsTrigger>
          <TabsTrigger value="templates">Șabloane Sarcini</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings profile={profile} user={user} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings preferences={preferences} userId={user.id} />
        </TabsContent>

        <TabsContent value="templates">
          <TaskTemplatesSettings templates={templates || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
