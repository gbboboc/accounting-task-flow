"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, CheckCircle2, XCircle } from "lucide-react"
import { TaskTemplateForm } from "./task-template-form"
import type { TaskTemplate } from "@/lib/types"

interface TaskTemplatesSettingsProps {
  templates: TaskTemplate[]
  isAdmin?: boolean
}

export function TaskTemplatesSettings({ templates, isAdmin = false }: TaskTemplatesSettingsProps) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Lunar",
      quarterly: "Trimestrial",
      annual: "Anual",
      weekly: "Săptămânal",
    }
    return labels[frequency] || frequency
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Șabloane Sarcini</CardTitle>
        <CardDescription>
          Gestionați șabloanele pentru generarea automată de sarcini pentru companiile dvs.
          {!isAdmin && (
            <span className="block mt-2 text-xs text-muted-foreground">
              Doar administratorii pot edita șabloanele.
            </span>
          )}
        </CardDescription>
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
                      Activ
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-muted-foreground gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactiv
                    </Badge>
                  )}
                </div>
                {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
                  <Badge variant="outline">
                    Scadență: Ziua {template.deadline_day}
                    {template.deadline_month && ` din Luna ${template.deadline_month}`}
                  </Badge>
                  {template.applies_to_tva_payers && <Badge variant="outline">Plătitori TVA</Badge>}
                  {template.applies_to_employers && <Badge variant="outline">Angajatori</Badge>}
                  {template.applies_to_org_types && template.applies_to_org_types.length > 0 && (
                    <Badge variant="outline">{template.applies_to_org_types.join(", ")}</Badge>
                  )}
                </div>
                {template.reminder_days && template.reminder_days.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Reamintiri: {template.reminder_days.join(", ")} zile înainte
                  </p>
                )}
              </div>
              {isAdmin ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(template)
                    setIsDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editează
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled>
                  <Edit className="h-4 w-4 mr-2" />
                  Editează
                </Button>
              )}
            </div>
          ))}

        </div>
      </CardContent>

      <TaskTemplateForm
        template={editingTemplate}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingTemplate(null)
          }
        }}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </Card>
  )
}
