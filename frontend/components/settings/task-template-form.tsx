"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type {
  TaskTemplate,
  TaskFrequency,
  OrganizationType,
} from "@/lib/types";

interface TaskTemplateFormProps {
  template: TaskTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const organizationTypes: OrganizationType[] = ["SRL", "ÎI", "ÎP", "ONG"];
const frequencies: TaskFrequency[] = [
  "monthly",
  "quarterly",
  "annual",
  "weekly",
];

export function TaskTemplateForm({
  template,
  open,
  onOpenChange,
  onSuccess,
}: TaskTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "monthly" as TaskFrequency,
    deadline_day: 1,
    deadline_month: null as number | null,
    applies_to_tva_payers: false,
    applies_to_employers: false,
    applies_to_org_types: [] as OrganizationType[],
    reminder_days: [7, 3, 1] as number[],
    is_active: true,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        frequency: template.frequency || "monthly",
        deadline_day: template.deadline_day || 1,
        deadline_month: template.deadline_month || null,
        applies_to_tva_payers: template.applies_to_tva_payers || false,
        applies_to_employers: template.applies_to_employers || false,
        applies_to_org_types: template.applies_to_org_types || [],
        reminder_days: template.reminder_days || [7, 3, 1],
        is_active: template.is_active !== undefined ? template.is_active : true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        frequency: "monthly",
        deadline_day: 1,
        deadline_month: null,
        applies_to_tva_payers: false,
        applies_to_employers: false,
        applies_to_org_types: [],
        reminder_days: [7, 3, 1],
        is_active: true,
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      if (template) {
        const response = await fetch(`/api/task-templates/${template.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update template");
        }

        toast.success("Șablonul a fost actualizat cu succes");
      } else {
        const response = await fetch(`/api/task-templates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create template");
        }

        toast.success("Șablonul a fost creat cu succes");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(
        `Error ${template ? "updating" : "creating"} template:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Eroare la ${
              template ? "actualizarea" : "crearea"
            } șablonului. Vă rugăm să încercați din nou.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrgTypeToggle = (orgType: OrganizationType) => {
    setFormData((prev) => ({
      ...prev,
      applies_to_org_types: prev.applies_to_org_types.includes(orgType)
        ? prev.applies_to_org_types.filter((type) => type !== orgType)
        : [...prev.applies_to_org_types, orgType],
    }));
  };

  const handleReminderDaysChange = (value: string) => {
    const days = value
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 0);
    setFormData((prev) => ({ ...prev, reminder_days: days }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editare Șablon Sarcină" : "Creare Șablon Sarcină"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Modificați detaliile șablonului de sarcină"
              : "Creați un nou șablon de sarcină pentru generarea automată"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nume <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                placeholder="ex: Declarație TVA Lunară"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrierea șablonului"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Frecvență <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: value as TaskFrequency,
                    }))
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq === "monthly"
                          ? "Lunar"
                          : freq === "quarterly"
                          ? "Trimestrial"
                          : freq === "annual"
                          ? "Anual"
                          : "Săptămânal"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline_day">
                  Ziua scadenței <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.deadline_day}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deadline_day: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {formData.frequency === "annual" && (
              <div className="space-y-2">
                <Label htmlFor="deadline_month">Luna scadenței</Label>
                <Select
                  value={formData.deadline_month?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      deadline_month:
                        value === "none" ? null : parseInt(value, 10),
                    }))
                  }
                >
                  <SelectTrigger id="deadline_month">
                    <SelectValue placeholder="Selectați luna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nu se aplică</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <SelectItem key={month} value={month.toString()}>
                          Luna {month}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Aplică pentru</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tva_payers"
                    checked={formData.applies_to_tva_payers}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        applies_to_tva_payers: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor="tva_payers"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Plătitori TVA
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="employers"
                    checked={formData.applies_to_employers}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        applies_to_employers: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor="employers"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Angajatori
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tipuri de organizații</Label>
              <div className="flex flex-wrap gap-3">
                {organizationTypes.map((orgType) => (
                  <div key={orgType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`org_${orgType}`}
                      checked={formData.applies_to_org_types.includes(orgType)}
                      onCheckedChange={() => handleOrgTypeToggle(orgType)}
                    />
                    <Label
                      htmlFor={`org_${orgType}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {orgType}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_days">
                Zile de reamintire (separate prin virgulă)
              </Label>
              <Input
                id="reminder_days"
                value={formData.reminder_days.join(", ")}
                onChange={(e) => handleReminderDaysChange(e.target.value)}
                placeholder="ex: 7, 3, 1"
              />
              <p className="text-xs text-muted-foreground">
                Zile înainte de scadență când se trimit reamintiri
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: checked === true,
                  }))
                }
              />
              <Label
                htmlFor="is_active"
                className="text-sm font-normal cursor-pointer"
              >
                Șablon activ
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? template
                  ? "Salvează..."
                  : "Creează..."
                : template
                ? "Salvează modificările"
                : "Creează șablon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
