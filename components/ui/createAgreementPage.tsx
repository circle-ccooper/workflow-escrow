"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadContractButton } from "@/components/upload-contract-button";

interface Wallet {
  circle_wallet_id: string;
}

interface Beneficiary {
  id: string;
  name: string;
  wallets: Wallet[];
}

export const CreateAgreementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [formError, setFormError] = useState("Please select a beneficiary before uploading a contract");

  const supabase = createClient();

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Not authenticated");
        }

        // Get all profiles except current user, including their wallets
        const { data: beneficiaries, error } = await supabase
          .from("profiles")
          .select("id, name, is_active, wallets (circle_wallet_id, is_active)")
          .neq("auth_user_id", user.id)

        if (error) {
          throw error;
        }

        setBeneficiaries(beneficiaries);
      } catch (error) {
        console.error("Error loading profiles:", error);
        setError(error instanceof Error ? error.message : "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error loading profiles: {error}</p>
      </div>
    );
  }

  return (
    <Card className="grow">
      <CardHeader>
        <CardTitle>Create new agreement</CardTitle>
      </CardHeader>
      <CardContent className={formError ? "pb-2" : ""}>
        <div className="grid w-full items-lef gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label>Beneficiary</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[300px] justify-between w-full"
                >
                  {selectedBeneficiary
                    ? beneficiaries.find(beneficiary => beneficiary.name === selectedBeneficiary)?.name
                    : "Select beneficiary..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <Label className="text-red-500">
                {formError}
              </Label>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput className="w-full" placeholder="Search beneficiary..." />
                  <CommandList>
                    <CommandEmpty>No beneficiaries found.</CommandEmpty>
                    <CommandGroup>
                      {beneficiaries.map(beneficiary => (
                        <CommandItem
                          key={beneficiary.id}
                          value={beneficiary.name}
                          onSelect={currentValue => {
                            setFormError(
                              selectedBeneficiary
                                ? "Please select a beneficiary before uploading a contract"
                                : ""
                              );
                            setSelectedBeneficiary(currentValue === selectedBeneficiary ? "" : currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBeneficiary === beneficiary.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {beneficiary.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <UploadContractButton beneficiaryWalletId={selectedBeneficiary} />
      </CardFooter>
    </Card>
  );
};
