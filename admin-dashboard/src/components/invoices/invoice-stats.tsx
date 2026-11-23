"use client";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
} from "@/components/tailgrids/core/alert";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  BoxIcon,
  EyeIcon,
  MoneyBagIcon,
  UserGroupIcon,
} from "@/app/(with-layouts)/(dashboard)/(home)/_component/overview-stats/icons";
import { formatMoney, type InvoiceSummary } from "./types";

export function InvoiceStats({ summary }: { summary: InvoiceSummary }) {
  const collectionRate =
    summary.totalRevenue > 0
      ? Math.round((summary.totalPaid / summary.totalRevenue) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Collected Paid */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <MoneyBagIcon />
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {summary.paidCount} paid
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1.5 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {formatMoney(summary.totalPaid)}
            </div>
            <Progress progress={collectionRate} withLabel className="max-w-full" />
          </CardContent>
          <CardFooter className="mt-2 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Collected Revenue</span>
            <span className="text-xs font-medium text-success-500">Rate</span>
          </CardFooter>
        </Card>

        {/* Pending / Awaiting */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
              <EyeIcon />
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {summary.sentCount} sent · {summary.draftCount} draft
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {formatMoney(summary.totalPending)}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Outstanding Balance</span>
            <span className="text-xs font-medium text-primary-500">Active Pipeline</span>
          </CardFooter>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-error-500/10 text-error-500">
              <BoxIcon />
            </div>
            <span className="text-xs font-medium text-error-500">
              {summary.overdueCount} past due
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div
              className={`mb-1 text-xl leading-7 font-semibold md:text-2xl ${
                summary.totalOverdue > 0 ? "text-error-500" : "text-text-primary"
              }`}
            >
              {formatMoney(summary.totalOverdue)}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Overdue Invoices</span>
            <span className="text-xs font-medium text-text-tertiary">
              {summary.overdueCount === 0 ? "All on track" : "Needs follow-up"}
            </span>
          </CardFooter>
        </Card>

        {/* Total Billed Volume */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <UserGroupIcon />
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {summary.count} records
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {formatMoney(summary.totalRevenue)}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Gross Studio Billing</span>
            <span className="text-xs font-medium text-text-tertiary">All Currencies</span>
          </CardFooter>
        </Card>
      </div>

      {summary.overdueCount > 0 && (
        <Alert status="warning" className="max-w-full">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>
              {summary.overdueCount} Overdue {summary.overdueCount === 1 ? "Invoice" : "Invoices"} Requiring Attention
            </AlertTitle>
            <AlertDescription>
              Total past-due amount is{" "}
              <strong className="text-text-primary">
                {formatMoney(summary.totalOverdue)}
              </strong>
              . Switch to the <strong>Overdue</strong> tab below to inspect details, send a mail reminder, or mark as paid.
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
