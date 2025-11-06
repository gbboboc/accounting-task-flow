"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  OrganizationType,
  TvaType,
  TaxRegime,
  Company,
} from "@/lib/types";

const steps = [
  { id: 1, name: "Informații de bază", description: "Detalii companie" },
  { id: 2, name: "Organizare", description: "Tip și structură" },
  { id: 3, name: "Fiscal", description: "Informații fiscale" },
  { id: 4, name: "Revizuire", description: "Confirmați detaliile" },
];

interface FormData {
  name: string;
  fiscal_code: string;
  location: string;
  contact_person: string;
  phone: string;
  email: string;
  organization_type: OrganizationType | "";
  is_tva_payer: boolean;
  tva_type: TvaType | "";
  has_employees: boolean;
  employee_count: number;
  tax_regime: TaxRegime | "";
  accounting_start_date: string;
  import_past_tasks: boolean;
}

interface CompanyFormWizardProps {
  companyId?: string;
  initialData?: Partial<Company>;
}

export function CompanyFormWizard({
  companyId,
  initialData,
}: CompanyFormWizardProps) {
  const router = useRouter();
  const isEditMode = !!companyId;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    fiscal_code: initialData?.fiscal_code || "",
    location: initialData?.location || "",
    contact_person: initialData?.contact_person || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    organization_type:
      (initialData?.organization_type as OrganizationType) || "",
    is_tva_payer: initialData?.is_tva_payer || false,
    tva_type: (initialData?.tva_type as TvaType) || "",
    has_employees: initialData?.has_employees || false,
    employee_count: initialData?.employee_count || 0,
    tax_regime: (initialData?.tax_regime as TaxRegime) || "",
    accounting_start_date: initialData?.accounting_start_date
      ? new Date(initialData.accounting_start_date).toISOString().split("T")[0]
      : "",
    import_past_tasks: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        fiscal_code: initialData.fiscal_code || "",
        location: initialData.location || "",
        contact_person: initialData.contact_person || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        organization_type:
          (initialData.organization_type as OrganizationType) || "",
        is_tva_payer: initialData.is_tva_payer || false,
        tva_type: (initialData.tva_type as TvaType) || "",
        has_employees: initialData.has_employees || false,
        employee_count: initialData.employee_count || 0,
        tax_regime: (initialData.tax_regime as TaxRegime) || "",
        accounting_start_date: initialData.accounting_start_date
          ? new Date(initialData.accounting_start_date)
              .toISOString()
              .split("T")[0]
          : "",
        import_past_tasks: false,
      });
    }
  }, [initialData]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name || !formData.fiscal_code || !formData.location) {
        setError("Vă rugăm completați toate câmpurile obligatorii");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.organization_type) {
        setError("Vă rugăm selectați tipul organizației");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.tax_regime || !formData.accounting_start_date) {
        setError("Vă rugăm completați toate câmpurile obligatorii");
        return;
      }
      if (formData.is_tva_payer && !formData.tva_type) {
        setError("Vă rugăm selectați tipul TVA");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const companyData = {
        name: formData.name,
        fiscal_code: formData.fiscal_code,
        location: formData.location,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        organization_type: formData.organization_type,
        is_tva_payer: formData.is_tva_payer,
        tva_type: formData.is_tva_payer ? formData.tva_type : null,
        has_employees: formData.has_employees,
        employee_count: formData.has_employees ? formData.employee_count : 0,
        tax_regime: formData.tax_regime,
        accounting_start_date: formData.accounting_start_date,
      };

      if (isEditMode && companyId) {
        // Update existing company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", companyId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (companyError) throw companyError;

        // Log activity
        await supabase.from("activity_log").insert({
          user_id: user.id,
          company_id: company.id,
          action: "company_updated",
          description: `Updated company: ${formData.name}`,
        });

        toast.success("Compania a fost actualizată cu succes.");
        router.push(`/companies/${company.id}`);
        router.refresh();
      } else {
        // Create new company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .insert({
            ...companyData,
            user_id: user.id,
            status: "active",
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Generate tasks for the company (only when creating)
        if (formData.import_past_tasks) {
          const { error: tasksError } = await supabase.rpc(
            "generate_tasks_for_company",
            {
              p_company_id: company.id,
              p_start_date: formData.accounting_start_date,
              p_months_ahead: 12,
            }
          );

          if (tasksError) {
            console.error("Error generating tasks:", tasksError);
            toast.error(
              "Compania a fost creată, dar generarea sarcinilor a eșuat."
            );
          } else {
            toast.success(
              "Compania a fost creată și sarcinile au fost generate."
            );
          }
        } else {
          toast.success("Compania a fost creată cu succes.");
        }

        // Log activity
        await supabase.from("activity_log").insert({
          user_id: user.id,
          company_id: company.id,
          action: "company_created",
          description: `Created company: ${formData.name}`,
        });

        router.push(`/companies/${company.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(
        isEditMode
          ? "Eroare la actualizarea companiei."
          : "Eroare la crearea companiei."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{step.name}</p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Numele companiei <span className="text-error">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., Moldova IT SRL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_code">
                  Cod fiscal (IDNO) <span className="text-error">*</span>
                </Label>
                <Input
                  id="fiscal_code"
                  value={formData.fiscal_code}
                  onChange={(e) =>
                    updateFormData("fiscal_code", e.target.value)
                  }
                  placeholder="e.g., 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">
                  Locație <span className="text-error">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  placeholder="e.g., Chișinău, Moldova"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Persoană de contact</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) =>
                    updateFormData("contact_person", e.target.value)
                  }
                  placeholder="e.g., Ion Popescu"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Număr de telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="e.g., +373 69 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="e.g., contact@company.md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Organization Type */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label>
                Selectați tipul de organizație{" "}
                <span className="text-error">*</span>
              </Label>
              <RadioGroup
                value={formData.organization_type}
                onValueChange={(value) =>
                  updateFormData("organization_type", value)
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="SRL" id="srl" />
                    <div className="flex-1">
                      <Label
                        htmlFor="srl"
                        className="cursor-pointer font-medium"
                      >
                        SRL (Societate cu Răspundere Limitată)
                      </Label>
                      {/* <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" />
                        Most common for businesses
                      </p> */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="ÎI" id="ii" />
                    <div className="flex-1">
                      <Label
                        htmlFor="ii"
                        className="cursor-pointer font-medium"
                      >
                        ÎI (Întreprindere Individuală)
                      </Label>
                      {/* <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" />
                        For individual entrepreneurs
                      </p> */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="ÎP" id="ip" />
                    <div className="flex-1">
                      <Label
                        htmlFor="ip"
                        className="cursor-pointer font-medium"
                      >
                        ÎP (Întreprinzător Patent)
                      </Label>
                      {/* <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" />
                        Simplified taxation regime
                      </p> */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="ONG" id="ong" />
                    <div className="flex-1">
                      <Label
                        htmlFor="ong"
                        className="cursor-pointer font-medium"
                      >
                        ONG (Organizație Necomercială)
                      </Label>
                      {/* <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" />
                        Non-profit organizations
                      </p> */}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Fiscal Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Regim de impozitare</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tva_payer"
                    checked={formData.is_tva_payer}
                    onCheckedChange={(checked) =>
                      updateFormData("is_tva_payer", checked)
                    }
                  />
                  <Label
                    htmlFor="tva_payer"
                    className="cursor-pointer font-normal"
                  >
                    TVA plătitor
                  </Label>
                </div>
                {formData.is_tva_payer && (
                  <RadioGroup
                    value={formData.tva_type}
                    onValueChange={(value) => updateFormData("tva_type", value)}
                    className="ml-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lunar" id="lunar" />
                      <Label
                        htmlFor="lunar"
                        className="cursor-pointer font-normal"
                      >
                        Lunar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="trimestrial" id="trimestrial" />
                      <Label
                        htmlFor="trimestrial"
                        className="cursor-pointer font-normal"
                      >
                        Trimestrial
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_employees"
                    checked={formData.has_employees}
                    onCheckedChange={(checked) => {
                      updateFormData("has_employees", checked);
                      if (!checked) updateFormData("employee_count", 0);
                    }}
                  />
                  <Label
                    htmlFor="has_employees"
                    className="cursor-pointer font-normal"
                  >
                    Are angajați
                  </Label>
                </div>
                {formData.has_employees && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="employee_count">Număr de angajați</Label>
                    <Input
                      id="employee_count"
                      type="number"
                      min="1"
                      value={formData.employee_count || ""}
                      onChange={(e) =>
                        updateFormData(
                          "employee_count",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_regime">
                  Regim de taxare <span className="text-error">*</span>
                </Label>
                <Select
                  value={formData.tax_regime}
                  onValueChange={(value) => updateFormData("tax_regime", value)}
                >
                  <SelectTrigger id="tax_regime">
                    <SelectValue placeholder="Selectați regimul de taxare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Regim general</SelectItem>
                    <SelectItem value="simplified">
                      Simplificat (Microîntreprindere 4%)
                    </SelectItem>
                    <SelectItem value="agricultural">
                      Impozit agricol
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accounting_start_date">
                  Data de început a contabilității{" "}
                  <span className="text-error">*</span>
                </Label>
                <Input
                  id="accounting_start_date"
                  type="date"
                  value={formData.accounting_start_date}
                  onChange={(e) =>
                    updateFormData("accounting_start_date", e.target.value)
                  }
                />
              </div>

              {!isEditMode && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import_past_tasks"
                    checked={formData.import_past_tasks}
                    onCheckedChange={(checked) =>
                      updateFormData("import_past_tasks", checked)
                    }
                  />
                  <Label
                    htmlFor="import_past_tasks"
                    className="cursor-pointer font-normal"
                  >
                    Importează sarcini din trecut (de la data de început)
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Informații de bază</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nume:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Cod fiscal:</dt>
                    <dd className="font-medium">{formData.fiscal_code}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Locație:</dt>
                    <dd className="font-medium">{formData.location}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Organizare</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tip:</dt>
                    <dd className="font-medium">
                      {formData.organization_type}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Detalii fiscale</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">TVA plătitor:</dt>
                    <dd className="font-medium">
                      {formData.is_tva_payer
                        ? `Da (${formData.tva_type})`
                        : "Nu"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Angajați:</dt>
                    <dd className="font-medium">
                      {formData.has_employees
                        ? `${formData.employee_count} angajați`
                        : "Fără angajați"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Regim de taxare:</dt>
                    <dd className="font-medium capitalize">
                      {formData.tax_regime}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Data de început:</dt>
                    <dd className="font-medium">
                      {formData.accounting_start_date}
                    </dd>
                  </div>
                </dl>
              </div>

              {!isEditMode && (
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Sarcini ce vor fi create:</strong> În funcție de
                    setările companiei, vom genera automat sarcinile și
                    termenele contabile corespunzătoare.
                  </p>
                </div>
              )}
              {isEditMode && (
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Notă:</strong> Modificările vor fi aplicate imediat.
                    Sarcinile existente nu vor fi modificate.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              Înapoi
            </Button>
            {currentStep < steps.length ? (
              <Button type="button" onClick={handleNext}>
                Înainte
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Se actualizează..."
                    : "Se creează..."
                  : isEditMode
                  ? "Actualizează compania"
                  : "Creează compania"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
