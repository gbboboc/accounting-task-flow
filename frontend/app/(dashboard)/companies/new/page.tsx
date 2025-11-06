import { DashboardHeader } from "@/components/dashboard-header"
import { CompanyFormWizard } from "@/components/company-form-wizard"

export default function NewCompanyPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <DashboardHeader
        title="Add New Company"
        description="Create a new company profile and set up automatic task generation"
      />
      <CompanyFormWizard />
    </div>
  )
}
