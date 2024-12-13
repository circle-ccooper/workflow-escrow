import { type FunctionComponent } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  workAccepted: boolean
  handleCongratulate: () => void
}

export const ValidationSucceededDialog: FunctionComponent<Props> = props => {
  return (
    <AlertDialog open={props.workAccepted}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Work Approved! {String.fromCodePoint(0x1F60A)}</AlertDialogTitle>
          <AlertDialogDescription>
            Congratulations, your work was accepted!
          </AlertDialogDescription>
          <h3>Your payment is on the way. {String.fromCodePoint(0x1F911)}</h3>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => props.handleCongratulate()}>
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}