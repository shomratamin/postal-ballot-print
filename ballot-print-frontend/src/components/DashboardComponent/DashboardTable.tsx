"use client";

import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";
import { renderCell } from "./render-cell";
import { Locale } from "@/dictionaries/dictionaty";
import { DashboardLocale } from "@/dictionaries/types";



const DashboardTable = ({lang,dashboardLocale}:{lang:Locale; dashboardLocale:DashboardLocale}) => {

  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

  const columns = [
    // { uid: "sl", nameKey: "sl" },
    { uid: "batch", nameKey: "batch" },
    { uid: "serial_no", nameKey: "serial_no" },
    { uid: "total_voter", nameKey: "total_voter" },
    { uid: "last_update", nameKey: "last_update" },
    { uid: "status", nameKey: "status" },
  ];

  type BatchData = {
    batch: string;
    serialNo: string;
    totalVoter: number;
    lastUpdate: string;
    status: "Created" | "Printed" | "Error";
  };

  const batchTableData: BatchData[] = [
    {
      batch: "0000001",
      serialNo: "70,00,001 - 70,00,100",
      totalVoter: 100,
      lastUpdate: "12:04:45 PM 03-12-2025",
      status: "Created",
    },
    {
      batch: "0000002",
      serialNo: "70,00,101 - 70,00,200",
      totalVoter: 100,
      lastUpdate: "12:04:45 PM 03-12-2025",
      status: "Printed",
    },
    {
      batch: "0000003",
      serialNo: "70,00,201 - 70,00,300",
      totalVoter: 100,
      lastUpdate: "12:04:45 PM 03-12-2025",
      status: "Printed",
    },
    {
      batch: "0000004",
      serialNo: "70,00,301 - 70,00,400",
      totalVoter: 100,
      lastUpdate: "12:04:45 PM 03-12-2025",
      status: "Error",
    },
    {
      batch: "0000005",
      serialNo: "70,00,401 - 70,00,450",
      totalVoter: 50,
      lastUpdate: "12:04:45 PM 03-12-2025",
      status: "Created",
    },
  ];
  return (
    <div className=" text-gray-800">
      <div className="w-full shadow-lg p-1 rounded-lg border border-gray-200">
        <div className="flex text-gray-800 justify-between px-8 mt-4 mb-2">
          <div className="flex gap-4 items-center">
            <div className=" flex rounded-full p-3 bg-[#e1d9ff] text-[#5925DC]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M18 16.75h-2a.75.75 0 0 1 0-1.5h2A1.25 1.25 0 0 0 19.25 14v-4A1.25 1.25 0 0 0 18 8.75H6A1.25 1.25 0 0 0 4.75 10v4A1.25 1.25 0 0 0 6 15.25h2a.75.75 0 0 1 0 1.5H6A2.75 2.75 0 0 1 3.25 14v-4A2.75 2.75 0 0 1 6 7.25h12A2.75 2.75 0 0 1 20.75 10v4A2.75 2.75 0 0 1 18 16.75"
                />
                <path
                  fill="currentColor"
                  d="M16 8.75a.76.76 0 0 1-.75-.75V4.75h-6.5V8a.75.75 0 0 1-1.5 0V4.5A1.25 1.25 0 0 1 8.5 3.25h7a1.25 1.25 0 0 1 1.25 1.25V8a.76.76 0 0 1-.75.75m-.5 12h-7a1.25 1.25 0 0 1-1.25-1.25v-7a1.25 1.25 0 0 1 1.25-1.25h7a1.25 1.25 0 0 1 1.25 1.25v7a1.25 1.25 0 0 1-1.25 1.25m-6.75-1.5h6.5v-6.5h-6.5Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg text-[#5925DC] ">{dashboardLocale.batch_list}</p>
              <p className="text-xs text-gray-700">
                {dashboardLocale.print_job_package_created_for_batch_printing}
              </p>
            </div>
          </div>

          <div>
            <Button size="md" radius="sm" color="primary">
             {dashboardLocale.create_batch} +{" "}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {/* Table Info */}
          {/* <div className="flex justify-between items-center p-2">
            <span className="text-default-400 text-sm dark:text-gray-300">
              total : 10 user
            </span>
            <div className="flex justify-center items-center mt-2 px-2 me-2 md:me-0 md:px-0">
              <label className="flex items-center text-default-400 text-sm dark:text-gray-300">
                rows per page :
                <select
                  aria-label="Rows Per Page"
                  className="bg-transparent outline-none ttext-default-400 text-sm dark:bg-gray-800 dark:text-gray-300 ml-1.5 border-default-200 border dark:border-gray-400 rounded px-1 "
                  value="5"
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>
          </div> */}

          {/* Table */}
          <div className="w-full overflow-x-auto  rounded-lg px-2 mt-2">
            <Table
              aria-label="Prebook bookings table"
              isCompact
              isStriped
              removeWrapper
              className="min-w-full "
              classNames={{
                th: "bg-[#EDF2F7] dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-center",
                tr: "data-[odd=true]:bg-gray-50 data-[odd=true]:dark:bg-gray-700/50 data-[hover=true]:bg-gray-100 data-[hover=true]:dark:bg-gray-700/50",
                td: "dark:text-gray-200",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    className="text-xs sm:text-sm font-semibold"
                  >
                    {column.nameKey.replace(/_/g, " ").toUpperCase()}
                  </TableColumn>
                )}
              </TableHeader>

              <TableBody
                items={batchTableData}
                loadingContent={<Spinner className="mt-6" />}
                emptyContent={
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Icon
                        icon="lucide:file-text"
                        width={48}
                        className="text-gray-300"
                      />
                      <div>
                        <p className="text-gray-500 font-medium">
                          no data found
                        </p>
                      </div>
                    </div>
                  </div>
                }
              >
                {(item) => (
                  <TableRow
                    key={item.batch}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-700/20 py-"
                  >
                    {(columnKey) => (
                      <TableCell className="text-xs md:text-medium text-gray-800">
                        {renderCell({
                          batchTableData: item,
                          columnKey,
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
           {/* <div className="flex justify-end my-2">
             <Button size="md" color="primary" variant="bordered" radius="sm" className="">View All</Button>
           </div> */}
          </div>


          {/* Pagination */}
        </div>
      </div>
    </div>
  );
};

export default DashboardTable;
