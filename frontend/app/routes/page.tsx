import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  Home,
  LogIn,
  Settings,
  UserPlus,
  LayoutDashboard,
} from "lucide-react"

export default function RoutesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">TaskFlow Accounting</h1>
            <p className="text-lg text-muted-foreground">Application Routes Overview</p>
          </div>

          {/* Authentication Routes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Authentication Routes (Public)
              </CardTitle>
              <CardDescription>Start here if you're new or need to log in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex flex-col items-start p-4 gap-2 bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span className="font-semibold">Login</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">Sign in to your account</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/auth/login</code>
                  </Button>
                </Link>

                <Link href="/auth/register">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex flex-col items-start p-4 gap-2 bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span className="font-semibold">Register</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">Create a new account</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/auth/register</code>
                  </Button>
                </Link>

                <Link href="/auth/verify-email">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex flex-col items-start p-4 gap-2 bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Verify Email</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">Confirm your email address</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/auth/verify-email</code>
                  </Button>
                </Link>

                <Link href="/auth/forgot-password">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex flex-col items-start p-4 gap-2 bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Forgot Password</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">Reset your password</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/auth/forgot-password</code>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Routes */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard Routes (Protected)
              </CardTitle>
              <CardDescription>These routes require authentication - login first!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      <span className="font-semibold">Dashboard</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">Main overview & statistics</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/dashboard</code>
                  </Button>
                </Link>

                <Link href="/companies">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-semibold">Companies</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">Manage all companies</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/companies</code>
                  </Button>
                </Link>

                <Link href="/companies/new">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-semibold">Add Company</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">Create new company</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/companies/new</code>
                  </Button>
                </Link>

                <Link href="/tasks">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span className="font-semibold">Tasks</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">View all tasks</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/tasks</code>
                  </Button>
                </Link>

                <Link href="/calendar">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">Calendar</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">Calendar view</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/calendar</code>
                  </Button>
                </Link>

                <Link href="/reports">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold">Reports</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">Analytics & reports</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/reports</code>
                  </Button>
                </Link>

                <Link href="/settings">
                  <Button variant="default" className="w-full h-auto flex flex-col items-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-semibold">Settings</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 text-left">User preferences</span>
                    <code className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">/settings</code>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Guide */}
          <Card className="shadow-lg bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>🚀 Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">First Time User</p>
                    <p className="text-sm text-muted-foreground">
                      Go to <code className="bg-white px-2 py-1 rounded">/auth/register</code> to create an account
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Returning User</p>
                    <p className="text-sm text-muted-foreground">
                      Go to <code className="bg-white px-2 py-1 rounded">/auth/login</code> to sign in
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Access Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      After login, you'll be redirected to{" "}
                      <code className="bg-white px-2 py-1 rounded">/dashboard</code>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>📱 Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once logged in, use the sidebar on the left to navigate between Dashboard, Companies, Tasks, Calendar,
                Reports, and Settings. The root route <code className="bg-muted px-2 py-1 rounded">/</code> will
                automatically redirect you to the dashboard if you're logged in, or to the login page if you're not.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
