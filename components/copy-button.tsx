"use client";

import { type FunctionComponent, useState } from "react";
import { Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { sleep } from "@/lib/utils/sleep";

interface Props {
  text: string;
}

export const CopyButton: FunctionComponent<Props> = (props) => {
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false);

  const handleCopy = async () => {
    setShouldShowTooltip(true);
    await navigator.clipboard.writeText(props.text).then(() => {
      sleep(700).then(() => setShouldShowTooltip(false));
    });
  };

  return (
    <TooltipProvider>
      <Tooltip open={shouldShowTooltip}>
        <TooltipTrigger asChild>
          <Button onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copied</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
