import type { FunctionComponent } from "react";
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
  validationResult: string[]
  handleClose: () => void
}

export const ValidationFailedDialog: FunctionComponent<Props> = props => {
  return (
    <AlertDialog open={props.validationResult.length > 0}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Work validation failed</AlertDialogTitle>
          <AlertDialogDescription>
            Consider addressing the issues listed below before trying again:
          </AlertDialogDescription>
          <ul className="my-6 ml-6 list-disc text-sm text-muted-foreground [&>li]:mt-2 [&>li:first-child]:mt-0">
            {props.validationResult.map((issue, index) => (
              <li key={index}>
                {issue}
              </li>
            ))}
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.handleClose}>
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}