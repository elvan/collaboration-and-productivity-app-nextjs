import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/header"
import { DashboardShell } from "@/components/shell"
import { ProfileForm } from "@/components/settings/profile-form"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSecurity } from "@/components/settings/profile-security"
import { ProfilePreferences } from "@/components/settings/profile-preferences"

export const metadata: Metadata = {
  title: "Profile Settings | CollabSpace",
  description: "Manage your profile settings and preferences",
}

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Profile Settings"
        text="Manage your profile information and preferences."
      />
      <div className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <ProfileForm user={session.user} />
          </TabsContent>
          <TabsContent value="security" className="space-y-4">
            <ProfileSecurity userId={session.user.id} />
          </TabsContent>
          <TabsContent value="preferences" className="space-y-4">
            <ProfilePreferences userId={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
