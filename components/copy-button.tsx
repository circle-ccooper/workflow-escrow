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

  const simulateTooltipOpening = async () => {
    setShouldShowTooltip(true);
    await sleep(700);
    setShouldShowTooltip(false);
  };

  return (
    <TooltipProvider>
      <Tooltip open={shouldShowTooltip}>
        <TooltipTrigger asChild>
          <Button onClick={simulateTooltipOpening}>
            <Copy
              className="h-4 w-4"
              onClick={() => navigator.clipboard.writeText(props.text)}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copied</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
