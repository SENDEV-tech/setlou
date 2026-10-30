"use client";

import { cn } from "@/lib/utils";

export type AuthMethod = "phone" | "email";

export function AuthMethodSwitch({
  value,
  onChange,
  emailLabel = "Email",
}: {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
  emailLabel?: string;
}) {
  const options: { value: AuthMethod; label: string }[] = [
    { value: "phone", label: "Téléphone" },
    { value: "email", label: emailLabel },
  ];
  return (
    <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md py-1.5 font-medium transition-colors",
            value === o.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
