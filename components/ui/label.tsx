"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Form labels are body sans, not mono. Family comes from the root.
        "text-[0.8125rem] text-body select-none peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
