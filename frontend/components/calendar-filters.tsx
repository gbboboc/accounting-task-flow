"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useRef, useState } from "react";

interface Company {
  id: string;
  name: string;
}

interface CalendarFiltersProps {
  companies?: Company[];
  initialCompany?: string;
  initialMonthly?: boolean;
  initialQuarterly?: boolean;
  initialAnnual?: boolean;
  initialWeekly?: boolean;
}

export function CalendarFilters({
  companies = [],
  initialCompany = "all",
  initialMonthly = true,
  initialQuarterly = true,
  initialAnnual = true,
  initialWeekly = true,
}: CalendarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState(initialCompany);
  const [monthly, setMonthly] = useState(initialMonthly);
  const [quarterly, setQuarterly] = useState(initialQuarterly);
  const [annual, setAnnual] = useState(initialAnnual);
  const [weekly, setWeekly] = useState(initialWeekly);
  const isUpdatingRef = useRef(false);
  const prevSearchParamsRef = useRef(searchParams.toString());

  const updateFilters = useCallback(
    (
      newCompany: string,
      newMonthly: boolean,
      newQuarterly: boolean,
      newAnnual: boolean,
      newWeekly: boolean
    ) => {
      const currentCompany = searchParams.get("company") || "all";
      const currentMonthly = searchParams.get("monthly") !== "false";
      const currentQuarterly = searchParams.get("quarterly") !== "false";
      const currentAnnual = searchParams.get("annual") !== "false";
      const currentWeekly = searchParams.get("weekly") !== "false";

      if (
        newCompany === currentCompany &&
        newMonthly === currentMonthly &&
        newQuarterly === currentQuarterly &&
        newAnnual === currentAnnual &&
        newWeekly === currentWeekly
      ) {
        return;
      }

      isUpdatingRef.current = true;
      const params = new URLSearchParams(searchParams.toString());

      if (newCompany && newCompany !== "all") {
        params.set("company", newCompany);
      } else {
        params.delete("company");
      }

      if (newMonthly) {
        params.delete("monthly");
      } else {
        params.set("monthly", "false");
      }

      if (newQuarterly) {
        params.delete("quarterly");
      } else {
        params.set("quarterly", "false");
      }

      if (newAnnual) {
        params.delete("annual");
      } else {
        params.set("annual", "false");
      }

      if (newWeekly) {
        params.delete("weekly");
      } else {
        params.set("weekly", "false");
      }

      router.replace(`/calendar?${params.toString()}`);

      setTimeout(() => {
        isUpdatingRef.current = false;
        prevSearchParamsRef.current = searchParams.toString();
      }, 150);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const currentParams = searchParams.toString();

    if (
      currentParams !== prevSearchParamsRef.current &&
      !isUpdatingRef.current
    ) {
      const urlCompany = searchParams.get("company") || "all";
      const urlMonthly = searchParams.get("monthly") !== "false";
      const urlQuarterly = searchParams.get("quarterly") !== "false";
      const urlAnnual = searchParams.get("annual") !== "false";
      const urlWeekly = searchParams.get("weekly") !== "false";

      setCompany(urlCompany);
      setMonthly(urlMonthly);
      setQuarterly(urlQuarterly);
      setAnnual(urlAnnual);
      setWeekly(urlWeekly);
    }

    prevSearchParamsRef.current = currentParams;
  }, [searchParams]);

  const handleCompanyChange = (value: string) => {
    setCompany(value);
    updateFilters(value, monthly, quarterly, annual, weekly);
  };

  const handleMonthlyChange = (checked: boolean) => {
    setMonthly(checked);
    updateFilters(company, checked, quarterly, annual, weekly);
  };

  const handleQuarterlyChange = (checked: boolean) => {
    setQuarterly(checked);
    updateFilters(company, monthly, checked, annual, weekly);
  };

  const handleAnnualChange = (checked: boolean) => {
    setAnnual(checked);
    updateFilters(company, monthly, quarterly, checked, weekly);
  };

  const handleWeeklyChange = (checked: boolean) => {
    setWeekly(checked);
    updateFilters(company, monthly, quarterly, annual, checked);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Companie</Label>
        <Select value={company} onValueChange={handleCompanyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Toate Companiile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate Companiile</SelectItem>
            {companies.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtre</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monthly"
              checked={monthly}
              onCheckedChange={handleMonthlyChange}
            />
            <Label
              htmlFor="monthly"
              className="text-sm font-normal cursor-pointer"
            >
              Declarații lunare
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quarterly"
              checked={quarterly}
              onCheckedChange={handleQuarterlyChange}
            />
            <Label
              htmlFor="quarterly"
              className="text-sm font-normal cursor-pointer"
            >
              Rapoarte trimestriale
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="annual"
              checked={annual}
              onCheckedChange={handleAnnualChange}
            />
            <Label
              htmlFor="annual"
              className="text-sm font-normal cursor-pointer"
            >
              Obligații anuale
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="weekly"
              checked={weekly}
              onCheckedChange={handleWeeklyChange}
            />
            <Label
              htmlFor="weekly"
              className="text-sm font-normal cursor-pointer"
            >
              Declarații săptămânale
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
