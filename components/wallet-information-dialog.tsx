import type { FunctionComponent } from "react";
import type { Wallet } from "@/types/database.types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";

interface Props {
  wallet: Wallet;
}

export const WalletInformationDialog: FunctionComponent<Props> = props => {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(props.wallet.balance));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto" variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wallet information</DialogTitle>
        </DialogHeader>
        <div className="grid py-4">
          <div className="flex flex-col">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
              Balance
            </h4>
            <div className="text-xl text-muted-foreground cursor-pointer mb-4">
              {formattedBalance}
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
              ID
            </h4>
            <div className="flex w-full items-center mb-4">
              <Input disabled value={props.wallet.circle_wallet_id} />
              <CopyButton text={props.wallet.circle_wallet_id} />
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
              Address
            </h4>
            <div className="flex w-full items-center mb-4">
              <Input disabled value={props.wallet.wallet_address} />
              <CopyButton text={props.wallet.wallet_address} />
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
              Blockchain
            </h4>
            <p className="text-xl text-muted-foreground cursor-pointer">
              {props.wallet.blockchain || "No wallet found"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}