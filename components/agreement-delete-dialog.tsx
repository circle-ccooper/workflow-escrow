import type { EscrowAgreementWithDetails } from "@/types/escrow";
import type { FunctionComponent, PropsWithChildren } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface Props extends PropsWithChildren {
  agreement: EscrowAgreementWithDetails
  profileId: string
  handleDeleteEscrow: (agreementId: string) => Promise<void>
}

export const AgreementDeleteDialog: FunctionComponent<Props> = props => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {props.children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Escrow Agreement with {props.profileId === props.agreement.depositor_wallet?.profile_id
            ? props.agreement.beneficiary_wallet?.profiles.name
            : props.agreement.depositor_wallet?.profiles.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this escrow agreement?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => props.handleDeleteEscrow(props.agreement.id)}>
            Yes
          </AlertDialogAction>
          <AlertDialogCancel>
            No
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}