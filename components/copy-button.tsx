"use client";

import type { FunctionComponent } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface Props {
  text: string
}

export const CopyButton: FunctionComponent<Props> = props => {
  return (
    <Button>
      <Copy
        className="h-4 w-4"
        onClick={() => navigator.clipboard.writeText(props.text)}
      />
    </Button>
  )
}