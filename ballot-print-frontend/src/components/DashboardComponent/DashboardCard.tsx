import React from "react";
import { Card, CardBody } from "@heroui/react";
import { DashboardLocale } from "@/dictionaries/types";
import { Locale } from "@/dictionaries/dictionaty";
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali";

type StatusCard = {
  id: string;
  title: string;
  value: number;
  colorClass: string;
  icon: React.ReactNode;
};

const DashboardCard = ({dashboardLocale,lang}:{dashboardLocale:DashboardLocale; lang:Locale}) => {
  const statusCards = React.useMemo<StatusCard[]>(
    () => [
      {
        id: "voters",
        title: "Voters",
        value: 378159,
        colorClass: "text-green-600",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
      },
      {
        id: "batches",
        title: "Batches",
        value: 1891,
        colorClass: "text-purple-600",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        ),
      },
      {
        id: "print_complete",
        title: "Print Complete",
        value: 160643,
        colorClass: "text-blue-600",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      {
        id: "print_pending",
        title: "Print Pending",
        value: 160643,
        colorClass: "text-orange-500",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      {
        id: "missed_data",
        title: "Missed Data",
        value: 99,
        colorClass: "text-red-600",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
      },
    ],
    []
  );
  return (
    <div className="w-full">
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {statusCards.map((item) => (
          <Card
            key={item.id}
            shadow="sm"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <CardBody className="px-3 py-4 flex flex-col gap-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className={item.colorClass}>{item.icon}</span>
                <p className="text-sm sm:text-base text-gray-800 dark:text-gray-100 font-bold">
                  {item.title==="Voters"?dashboardLocale.voters:item.title==="Batches"?dashboardLocale.batch_list:item.title==="Print Complete"?dashboardLocale.print_complete:item.title==="Print Pending"?dashboardLocale.print_pending:item.title==="Missed Data"?dashboardLocale.missed_data:item.title}
                </p>
              </div>

              <p className={`text-lg sm:text-xl font-bold ${item.colorClass}`}>
                {lang==="bn"? e_to_b(item.value.toString()):item.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardCard;
