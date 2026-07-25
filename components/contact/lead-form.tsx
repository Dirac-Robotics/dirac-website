"use client";

import { useActionState } from "react";

import { submitLead, type LeadFormState } from "@/app/actions/leads";
import { LEAD_INTERESTS, type LeadInterest } from "@/lib/validation";
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

const INTEREST_LABELS: Record<LeadInterest, string> = {
  real2sim: "Real2Sim",
  evals: "Evals",
  assets: "Asset packs",
  other: "Other",
};

/**
 * Shared lead capture form.
 *   variant="full"    -> Contact page (all fields incl. interest select)
 *   variant="compact" -> bottom of stub pages (interest preset + hidden)
 * Validated with the same Zod schema on client and server.
 */
export function LeadForm({
  variant = "full",
  presetInterest,
  sourcePage,
}: {
  variant?: "full" | "compact";
  presetInterest?: LeadInterest;
  sourcePage?: string;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    submitLead,
    { status: "idle" },
  );

  if (state.status === "success") {
    return (
      <div className="border border-border p-6">
        <p className="text-base text-foreground">Message received.</p>
        <p className="ui-text mt-2">
          Thanks for reaching out. We will be in touch shortly.
        </p>
      </div>
    );
  }

  const fieldErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {sourcePage ? (
        <input type="hidden" name="sourcePage" value={sourcePage} />
      ) : null}
      {variant === "compact" && presetInterest ? (
        <input type="hidden" name="interest" value={presetInterest} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="lead-name" error={fieldErrors.name}>
          <Input id="lead-name" name="name" autoComplete="name" required />
        </FormField>
        <FormField label="Email" htmlFor="lead-email" error={fieldErrors.email}>
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
      </div>

      {variant === "full" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Company"
            htmlFor="lead-company"
            error={fieldErrors.company}
          >
            <Input
              id="lead-company"
              name="company"
              autoComplete="organization"
            />
          </FormField>
          <FormField label="Interest" htmlFor="lead-interest">
            <Select name="interest" defaultValue={presetInterest ?? "real2sim"}>
              <SelectTrigger id="lead-interest">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_INTERESTS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {INTEREST_LABELS[i]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      ) : null}

      <FormField
        label="Message"
        htmlFor="lead-message"
        error={fieldErrors.message}
      >
        <Textarea
          id="lead-message"
          name="message"
          rows={variant === "compact" ? 3 : 5}
        />
      </FormField>

      {state.status === "error" ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
