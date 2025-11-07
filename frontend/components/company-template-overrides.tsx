"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { TaskTemplate, TaskTemplateOverride } from "@/lib/types"

interface CompanyTemplateOverridesProps {
  companyId: string
  templates: TaskTemplate[]
}

export function CompanyTemplateOverrides({
  companyId,
  templates,
}: CompanyTemplateOverridesProps) {
  const [overrides, setOverrides] = useState<Record<string, TaskTemplateOverride>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchOverrides()
  }, [companyId])

  const fetchOverrides = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/template-overrides`)
      if (!response.ok) {
        throw new Error("Failed to fetch overrides")
      }

      const { data } = await response.json()
      const overridesMap: Record<string, TaskTemplateOverride> = {}
      data.forEach((override: TaskTemplateOverride) => {
        overridesMap[override.template_id] = override
      })
      setOverrides(overridesMap)
    } catch (error) {
      console.error("Error fetching overrides:", error)
      toast.error("Eroare la încărcarea overridelor")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOverride = async (templateId: string, isDisabled: boolean) => {
    setUpdating(templateId)
    try {
      const response = await fetch(`/api/companies/${companyId}/template-overrides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          template_id: templateId,
          is_disabled: isDisabled,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update override")
      }

      const { data } = await response.json()
      setOverrides((prev) => ({
        ...prev,
        [templateId]: data,
      }))

      toast.success(
        isDisabled
          ? "Șablonul a fost dezactivat pentru această companie"
          : "Șablonul a fost reactivat pentru această companie"
      )
    } catch (error) {
      console.error("Error updating override:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Eroare la actualizarea override-ului"
      )
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveOverride = async (templateId: string) => {
    setUpdating(templateId)
    try {
      const response = await fetch(
        `/api/companies/${companyId}/template-overrides?template_id=${templateId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove override")
      }

      setOverrides((prev) => {
        const newOverrides = { ...prev }
        delete newOverrides[templateId]
        return newOverrides
      })

      toast.success("Override-ul a fost eliminat")
    } catch (error) {
      console.error("Error removing override:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Eroare la eliminarea override-ului"
      )
    } finally {
      setUpdating(null)
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Lunar",
      quarterly: "Trimestrial",
      annual: "Anual",
      weekly: "Săptămânal",
    }
    return labels[frequency] || frequency
  }

  const isTemplateDisabled = (templateId: string) => {
    return overrides[templateId]?.is_disabled === true
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionare Șabloane Sarcini</CardTitle>
        <CardDescription>
          Dezactivați șabloanele de sarcini care nu se aplică acestei companii. Modificările
          vor afecta doar generarea viitoare de sarcini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu există șabloane disponibile.
            </p>
          ) : (
            templates.map((template) => {
              const override = overrides[template.id]
              const isDisabled = isTemplateDisabled(template.id)
              const hasOverride = !!override

              return (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{template.name}</h4>
                      {!template.is_active && (
                        <Badge variant="outline" className="bg-gray-50 text-muted-foreground">
                          Inactiv
                        </Badge>
                      )}
                      {isDisabled && (
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-600 border-orange-200"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Dezactivat
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
                      <Badge variant="outline">
                        Scadență: Ziua {template.deadline_day}
                        {template.deadline_month && ` din Luna ${template.deadline_month}`}
                      </Badge>
                      {template.applies_to_tva_payers && (
                        <Badge variant="outline">Plătitori TVA</Badge>
                      )}
                      {template.applies_to_employers && (
                        <Badge variant="outline">Angajatori</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`template-${template.id}`}
                        checked={!isDisabled}
                        onCheckedChange={(checked) =>
                          handleToggleOverride(template.id, !checked)
                        }
                        disabled={updating === template.id || !template.is_active}
                      />
                      <Label
                        htmlFor={`template-${template.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {isDisabled ? "Dezactivat" : "Activ"}
                      </Label>
                    </div>
                    {hasOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOverride(template.id)}
                        disabled={updating === template.id}
                      >
                        Resetare
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

