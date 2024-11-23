"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" aria-disabled={pending} {...props}>
      {pending
        ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {pendingText}
          </>
        )
        : children}
    </Button>
  );
}
