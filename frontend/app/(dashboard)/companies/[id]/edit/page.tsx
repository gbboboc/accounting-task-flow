import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { CompanyFormWizard } from "@/components/company-form-wizard";
import { notFound, redirect } from "next/navigation";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/companies/new");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !company) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <DashboardHeader
        title="Editare Companie"
        description="Actualizați informațiile companiei"
      />
      <CompanyFormWizard companyId={id} initialData={company} />
    </div>
  );
}

