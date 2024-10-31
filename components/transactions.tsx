"use client"

import type { FunctionComponent } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string
  status: string
  createDate: string
  amount: string[]
}

interface Props {
  data?: Transaction[]
}

export const Transactions: FunctionComponent<Props> = props => {
  const router = useRouter();

  if (props.data && props.data.length < 1) {
    return (
      <p className="text-xl text-muted-foreground cursor-pointer mb-4">
        No transactions found
      </p>
    )
  }

  return (
    <Table className="mb-4">
      <TableHeader>
        <TableRow>
          <TableHead>Id</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.data?.map(transaction => (
          <TableRow onClick={() => router.push(`/protected/transaction/${transaction.id}`)} className="cursor-pointer" key={transaction.id}>
            <TableCell className="font-medium">{transaction.id}</TableCell>
            <TableCell>{transaction.status}</TableCell>
            <TableCell>{transaction.createDate}</TableCell>
            <TableCell className="text-right">{transaction.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}