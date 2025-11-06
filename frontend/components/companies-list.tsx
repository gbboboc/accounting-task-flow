"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CompanyCard } from "@/components/company-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Company } from "@/lib/types";

interface CompaniesListProps {
  companies: (Company & {
    taskStats?: {
      completed: number;
      pending: number;
      overdue: number;
    };
  })[];
}

export function CompaniesList({ companies }: CompaniesListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setCompanyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to delete a company.");
        return;
      }

      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyToDelete.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast.success(`Company "${companyToDelete.name}" has been deleted.`);

      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete company. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onDelete={(id) => handleDeleteClick(id, company.name)}
          />
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company{" "}
              <span className="font-semibold">
                &quot;{companyToDelete?.name}&quot;
              </span>{" "}
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-error text-error-foreground hover:bg-error/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
