"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, CheckCircle2, XCircle } from "lucide-react"
import type { TaskTemplate } from "@/lib/types"

interface TaskTemplatesSettingsProps {
  templates: TaskTemplate[]
}

export function TaskTemplatesSettings({ templates }: TaskTemplatesSettingsProps) {
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
      weekly: "Weekly",
    }
    return labels[frequency] || frequency
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Templates</CardTitle>
        <CardDescription>Manage automatic task generation templates for your companies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{template.name}</h4>
                  {template.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-success border-success gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-muted-foreground gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
                {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
                  <Badge variant="outline">
                    Deadline: Day {template.deadline_day}
                    {template.deadline_month && ` of Month ${template.deadline_month}`}
                  </Badge>
                  {template.applies_to_tva_payers && <Badge variant="outline">TVA Payers</Badge>}
                  {template.applies_to_employers && <Badge variant="outline">Employers</Badge>}
                  {template.applies_to_org_types && template.applies_to_org_types.length > 0 && (
                    <Badge variant="outline">{template.applies_to_org_types.join(", ")}</Badge>
                  )}
                </div>
                {template.reminder_days && template.reminder_days.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Reminders: {template.reminder_days.join(", ")} days before
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" disabled>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button variant="outline" disabled>
              Create New Template
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Template editing coming in a future update</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
