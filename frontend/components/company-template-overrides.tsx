"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Settings } from "lucide-react"
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
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    is_disabled: false,
    custom_deadline_day: null as number | null,
    custom_deadline_month: null as number | null,
    notes: "",
  })

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

  const handleToggleOverride = async (
    templateId: string,
    isDisabled: boolean,
    preserveSettings = false
  ) => {
    setUpdating(templateId)
    try {
      const existingOverride = overrides[templateId]
      const payload: any = {
        template_id: templateId,
        is_disabled: isDisabled,
      }

      if (preserveSettings && existingOverride) {
        payload.custom_deadline_day = existingOverride.custom_deadline_day ?? null
        payload.custom_deadline_month = existingOverride.custom_deadline_month ?? null
        payload.notes = existingOverride.notes || null
      }

      const response = await fetch(`/api/companies/${companyId}/template-overrides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
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

  const handleEditOverride = (template: TaskTemplate) => {
    const override = overrides[template.id]
    setEditingTemplate(template)
    setEditForm({
      is_disabled: override?.is_disabled ?? false,
      custom_deadline_day: override?.custom_deadline_day ?? null,
      custom_deadline_month: override?.custom_deadline_month ?? null,
      notes: override?.notes || "",
    })
    setEditDialogOpen(true)
  }

  const handleSaveOverride = async () => {
    if (!editingTemplate) return

    setUpdating(editingTemplate.id)
    try {
      const response = await fetch(`/api/companies/${companyId}/template-overrides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          template_id: editingTemplate.id,
          is_disabled: editForm.is_disabled,
          custom_deadline_day: editForm.custom_deadline_day || null,
          custom_deadline_month: editForm.custom_deadline_month || null,
          notes: editForm.notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update override")
      }

      const { data } = await response.json()
      setOverrides((prev) => ({
        ...prev,
        [editingTemplate.id]: data,
      }))

      toast.success("Setările override-ului au fost actualizate")
      setEditDialogOpen(false)
      setEditingTemplate(null)
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

  const getEffectiveDeadline = (template: TaskTemplate, override?: TaskTemplateOverride) => {
    const day = override?.custom_deadline_day ?? template.deadline_day
    const month = override?.custom_deadline_month ?? template.deadline_month
    return { day, month }
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestionare Șabloane Sarcini</CardTitle>
          <CardDescription>
            Personalizați scadențele și dezactivați șabloanele de sarcini care nu se aplică
            acestei companii. Modificările vor afecta doar generarea viitoare de sarcini.
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
                const effectiveDeadline = getEffectiveDeadline(template, override)
                const hasCustomDeadline =
                  override?.custom_deadline_day || override?.custom_deadline_month

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
                        {hasCustomDeadline && !isDisabled && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                            Scadență personalizată
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
                        <Badge variant="outline">
                          Scadență: Ziua {effectiveDeadline.day}
                          {effectiveDeadline.month && ` din Luna ${effectiveDeadline.month}`}
                          {hasCustomDeadline && (
                            <span className="ml-1 text-blue-600">(personalizat)</span>
                          )}
                        </Badge>
                        {template.applies_to_tva_payers && (
                          <Badge variant="outline">Plătitori TVA</Badge>
                        )}
                        {template.applies_to_employers && (
                          <Badge variant="outline">Angajatori</Badge>
                        )}
                      </div>
                      {override?.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          Notă: {override.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`template-${template.id}`}
                          checked={!isDisabled}
                          onCheckedChange={(checked) =>
                            handleToggleOverride(template.id, !checked, true)
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOverride(template)}
                        disabled={updating === template.id}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Editează Override - {editingTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Personalizați scadența și adăugați note pentru acest șablon în contextul acestei
              companii.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-disabled"
                checked={!editForm.is_disabled}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, is_disabled: !checked })
                }
              />
              <Label htmlFor="edit-is-disabled" className="cursor-pointer">
                Șablon activ pentru această companie
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Scadență personalizată (opțional)</Label>
              <p className="text-xs text-muted-foreground">
                Lăsați necompletat pentru a folosi scadența standard a șablonului
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-deadline-day" className="text-sm">
                    Ziua (1-31)
                  </Label>
                  <Input
                    id="custom-deadline-day"
                    type="number"
                    min="1"
                    max="31"
                    value={editForm.custom_deadline_day || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        custom_deadline_day: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={editingTemplate?.deadline_day.toString()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-deadline-month" className="text-sm">
                    Luna (1-12)
                  </Label>
                  <Input
                    id="custom-deadline-month"
                    type="number"
                    min="1"
                    max="12"
                    value={editForm.custom_deadline_month || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        custom_deadline_month: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={
                      editingTemplate?.deadline_month
                        ? editingTemplate.deadline_month.toString()
                        : "N/A"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-notes">Notițe (opțional)</Label>
              <Textarea
                id="override-notes"
                placeholder="Adăugați notițe despre această personalizare..."
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingTemplate(null)
              }}
            >
              Anulează
            </Button>
            <Button onClick={handleSaveOverride} disabled={updating === editingTemplate?.id}>
              {updating === editingTemplate?.id ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
