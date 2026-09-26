"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  
  const initialFrom = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 30));
  const initialTo = toParam ? new Date(toParam) : new Date();

  const handleFromSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", newDate.toISOString());
      if (!toParam) params.set("to", initialTo.toISOString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleToSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const params = new URLSearchParams(searchParams.toString());
      if (!fromParam) params.set("from", initialFrom.toISOString());
      params.set("to", newDate.toISOString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className={cn("flex items-center flex-wrap gap-2", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={"outline"}
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !initialFrom && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {initialFrom ? format(initialFrom, "d LLL y", { locale: fr }) : <span>Début</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={initialFrom}
            onSelect={handleFromSelect}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">au</span>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={"outline"}
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !initialTo && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {initialTo ? format(initialTo, "d LLL y", { locale: fr }) : <span>Fin</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={initialTo}
            onSelect={handleToSelect}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
