import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader title="Reports" description="View analytics and reports for your accounting tasks" />
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Reports will be implemented in a future phase</p>
      </Card>
    </div>
  )
}
