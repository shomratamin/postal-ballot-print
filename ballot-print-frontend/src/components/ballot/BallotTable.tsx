"use client";

import {
  Input,
  Pagination,
  Selection,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  RangeValue,
  DateRangePicker,
} from "@heroui/react";

import React, { useEffect, useState } from "react";
import {
  getLocalTimeZone,
  parseZonedDateTime,
  ZonedDateTime,
} from "@internationalized/date";
import Cookies from "js-cookie";
import { Icon } from "@iconify/react";
import {
  ArticleEventListRequestParams,
  ArticleEventRow,
} from "@/lib/store/common/types";
import { Locale } from "@/dictionaries/dictionaty";
import { BallotLocale} from "@/dictionaries/types";
import { initialDateTimeRangeOptionsBn } from "@/lib/store/common/store";
import { useWeightMachine } from "@/src/app/context/weight-machine-context";
import { useDmsPrintArticle } from "@/lib/hooks/useDmsPrintArticle";
import {
  DmsPrintJobRequest,
  DmsPrintJobResponse,
} from "@/lib/store/post/types";
import ballotData from "./ballot.json";
import { RenderCell } from "./render-cell";
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali";

const columns = [
  { name: "serial_no", uid: "serial_no" },
  { name: "outbound_address", uid: "outbound_address" },
  { name: "inbound_address", uid: "inbound_address" },
  { name: "last_update", uid: "last_update" },
  { name: "status", uid: "status" },
  { name: "action", uid: "action" },
];

const BallotTable = ({
  lang,
  ballotLocale,
}: {
  lang: Locale;
  ballotLocale: BallotLocale;
}) => {
  const access = Cookies.get("access") || "";

  const { isConnected, printerId, showBanner, setShowBanner, weightDimData } =
    useWeightMachine();
  const { mutate: printDmsArticle } = useDmsPrintArticle();

  const [selectedOption, setSelectedOption] = useState<Selection>(
    new Set(["daily"])
  );

  // Receipt print handler
  const handleReceiptPrint = (article_data: ArticleEventRow) => {
    console.log("Printing receipt for article:", article_data);
    if (!printerId) {
      alert("Printer not connected. Please connect printer first.");
      return;
    }

    let receipt_job_transformed: DmsPrintJobRequest = {
      token: access,
      payload: {
        printer_id: printerId || "",
        command: "live-print",
        job_type: "dms-receipt-printing",
        print_type: "receipt",
        barcode: article_data.barcode,
      },
    };

    printDmsArticle(receipt_job_transformed, {
      onSuccess: (res: DmsPrintJobResponse) => {
        console.log("Receipt Print job sent successfully", res);
        if (res.status === "success" || res.status === "already-printed") {
          // Handle success - you can add notification here
          console.log(
            "Receipt printed successfully for barcode:",
            article_data.barcode
          );
        }
      },
      onError: (error) => {
        console.error("Error sending receipt print job:", error);
        // Handle error - you can add notification here
      },
    });
  };
  const [selectedOptionName, setSelectedOptionName] = useState("daily");
  const [isMounted, setIsMounted] = useState(false);

  const [searchValue, setSearchValue] = useState<string>("");
  const [per_page, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const timeZone = getLocalTimeZone();
  const now = new Date();

  const getStartDate = (option: string) => {
    const newDate = new Date(now); // Start with the current date
    const timezone = "Asia/Dhaka"; // Time zone you need

    switch (option) {
      case "daily":
        // Set to the beginning of the current date at 00:00 AM (midnight)
        newDate.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        // Set to the most recent Sunday at 00:00 AM
        const dayOfWeek = newDate.getDay();
        const diffToSunday = dayOfWeek === 0 ? 0 : dayOfWeek; // If it's Sunday (0), no change
        newDate.setDate(newDate.getDate() - diffToSunday);
        newDate.setHours(0, 0, 0, 0);
        break;
      case "fortnightly":
        // Set to the 1st-15th or 16th-end period
        const currentDay = newDate.getDate();
        if (currentDay <= 15) {
          // 1st-15th: start on the 1st of the current month
          newDate.setDate(1);
        } else {
          // 16th-end: start on the 16th of the current month
          newDate.setDate(16);
        }
        newDate.setHours(0, 0, 0, 0);
        break;
      case "hourly":
        // Set to one hour ago, keeping the same minute
        newDate.setHours(newDate.getHours() - 1);
        break;
      case "yearly":
        // Set to the 1st January of the current year at 00:00 AM
        newDate.setMonth(0); // January is month 0
        newDate.setDate(1); // 1st day of the month
        newDate.setHours(0, 0, 0, 0);
        break;
      default: // monthly
        // Set to the 1st day of the current month at 00:00 AM
        newDate.setDate(1);
        newDate.setHours(0, 0, 0, 0);
        break;
    }

    // Convert the new date to the specific timezone and return as ISO string format
    return newDate
      .toLocaleString("sv-SE", { timeZone: timezone, hour12: false })
      .replace(" ", "T");
  };

  const [selectedArticleKeys, setSelectedArticleKeys] = useState<Selection>(
    new Set([""])
  );

  const [selectedStatus, setSelectedStatus] = useState<Selection>(
    new Set(["BOOKED"])
  );

  const [selectedServiceType, setSelectedServiceType] = useState<Selection>(
    new Set([])
  );

  const currentDateTime = now
    .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka", hour12: false })
    .replace(" ", "T");

  // Set initial state using the calculated start and end times
  const [createdDateTimeRange, setCreatedDateTimeRange] = useState<
    RangeValue<ZonedDateTime>
  >({
    start: parseZonedDateTime(
      `${getStartDate(selectedOptionName)}[${timeZone}]`
    ),
    end: parseZonedDateTime(`${currentDateTime}[${timeZone}]`),
  });

  // Set mounted state to avoid hydration issues with selection mode
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // console.log("selectedOption", selectedOption);
    const updatedStart = getStartDate(selectedOptionName);
    setCreatedDateTimeRange({
      start: parseZonedDateTime(`${updatedStart}[${timeZone}]`),
      end: parseZonedDateTime(`${currentDateTime}[${timeZone}]`),
    });
  }, [selectedOption]);

  useEffect(() => {
    setQueryParams({
      ...queryParams,
      from_date: formatDateToServerFormat(createdDateTimeRange.start),
      to_date: formatDateToServerFormat(createdDateTimeRange.end),
    });
  }, [createdDateTimeRange]);

  const formatDateForAPI = (date: ZonedDateTime) => {
    const jsDate = date.toDate();
    const day = jsDate.getDate().toString().padStart(2, "0");
    const month = (jsDate.getMonth() + 1).toString().padStart(2, "0");
    const year = jsDate.getFullYear();
    const hours = jsDate.getHours().toString().padStart(2, "0");
    const minutes = jsDate.getMinutes().toString().padStart(2, "0");
    const seconds = jsDate.getSeconds().toString().padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const [queryParams, setQueryParams] = useState<ArticleEventListRequestParams>(
    {
      from_date: "",
      to_date: "",
      barcode: "",
      event_type: "BOOKED",
      service_type: "",
      page: 1,
      page_size: 10,
    }
  );

  // Use ballot data from JSON instead of API
  const [ballotRecords, setBallotRecords] = useState(ballotData);
  const [filteredBallotRecords, setFilteredBallotRecords] =
    useState(ballotData);

  // Pagination for ballot data
  const indexOfLastRecord = currentPage * per_page;
  const indexOfFirstRecord = indexOfLastRecord - per_page;
  const currentRecords = filteredBallotRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredBallotRecords.length / per_page);

  // Handle ballot action
  const handleBallotAction = (
    ballot: (typeof ballotData)[0],
    actionType: string
  ) => {
    console.log("Action:", actionType, "for ballot:", ballot);
    // Add your action handling logic here
    switch (actionType) {
      case "view":
        alert(`Viewing ballot ${ballot.serial_no}`);
        break;
      case "print":
        alert(`Printing ballot ${ballot.serial_no}`);
        break;
      case "retry":
        alert(`Retrying ballot ${ballot.serial_no}`);
        break;
      case "reprint":
        alert(`Reprinting ballot ${ballot.serial_no}`);
        break;
    }
  };

  // Filter ballot data based on search
  useEffect(() => {
    if (searchValue) {
      const filtered = ballotData.filter(
        (item) =>
          item.serial_no.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.outbound_address
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          item.inbound_address.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredBallotRecords(filtered);
      setCurrentPage(1);
    } else {
      setFilteredBallotRecords(ballotData);
    }
  }, [searchValue]);

  // const {
  //   data,
  //   error,
  //   isLoading: isLoadingArticleEventData,
  // } = useGetArticleEvent(access, queryParams);

  // let initial_reports: ArticleEventRow[] = [];
  // const reports = Array.isArray(data?.data) ? data.data : initial_reports;
  // console.log("article event reports", data);
  // const total = data?.total_items || 0;

  // const is_pagination_show =
  //   !isLoadingArticleEventData &&
  //   Array.isArray(data?.data) &&
  //   data.data.length > 0;

  // // Helper function to get selected articles
  // const getSelectedArticles = () => {
  //   if (selectedArticleKeys === "all") {
  //     return reports;
  //   }
  //   if (selectedArticleKeys instanceof Set) {
  //     return reports.filter((article) =>
  //       selectedArticleKeys.has(article.id.toString())
  //     );
  //   }
  //   return [];
  // };

  const handleSelectedOption = (value: Selection) => {
    const selectedValue = Array.from(value)[0] as string;
    setSelectedOption(value);
    setSelectedOptionName(selectedValue);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setQueryParams((prev) => ({
      ...prev,
      page: page,
    }));
  };

  const handleRowsPerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1); // Reset to first page when changing rows per page
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      page_size: value,
    }));
  };

  const handleCreatedDateTimeRange = (
    value: RangeValue<ZonedDateTime> | null
  ) => {
    if (value && value.start && value.end) {
      // Check if start date is not greater than end date
      if (value.start.compare(value.end) <= 0) {
        setCreatedDateTimeRange(value);
        setQueryParams((prev) => ({
          ...prev,
          from_date: formatDateForAPI(value.start),
          to_date: formatDateForAPI(value.end),
          page: 1, // Reset to first page when date range changes
        }));
      } else {
        // If start date is greater than end date, don't update and optionally show a message
        console.warn("Start date cannot be greater than end date");
      }
    }
  };
  const handleSearchValue = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page when search value changes
    setQueryParams((prev) => ({
      ...prev,
      barcode: value,
      page: 1,
    }));
  };

  const handleSelectedServiceType = (value: Selection) => {
    setSelectedServiceType(value);
    const selectedValue = Array.from(value)[0] as string;
    setCurrentPage(1); // Reset to first page when service type changes
    setQueryParams((prev) => ({
      ...prev,
      service_type: selectedValue || "",
      page: 1,
    }));
  };

  const handleSelectedStatus = (value: Selection) => {
    setSelectedStatus(value);
    const selectedValue = Array.from(value)[0] as string;
    setCurrentPage(1); // Reset to first page when status changes
    setQueryParams((prev) => ({
      ...prev,
      event_type: selectedValue || "",
      page: 1,
    }));
  };

  const formatDateToServerFormat = (date: ZonedDateTime) => {
    const jsDate = date.toDate();
    const day = jsDate.getDate().toString().padStart(2, "0");
    const month = (jsDate.getMonth() + 1).toString().padStart(2, "0");
    const year = jsDate.getFullYear();
    const hours = jsDate.getHours().toString().padStart(2, "0");
    const minutes = jsDate.getMinutes().toString().padStart(2, "0");
    const seconds = jsDate.getSeconds().toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };
  return (
    <div className="w-full flex flex-col ">
      <div
        className="flex flex-wrap justify-between items-center 
  ss:flex-col xxs:flex-col xs:flex-col sm:flex-col md:flex-row ss:gap-2 xxs:gap-2 xs:gap-3 sm:gap-3 md:gap-4 my-2"
      >
        {/* Date Range Selection Controls */}
        <div className="w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
          <Select
            size="md"
            aria-label="Date Range"
            variant="bordered"
            label={ballotLocale.select_a_period}
            labelPlacement="outside"
            placeholder={ballotLocale.select_a_period}
            selectedKeys={selectedOption}
            className="w-full text-default-400"
            classNames={{
              popoverContent: "text-postDarkest dark:text-postLightest",
            }}
            onSelectionChange={handleSelectedOption}
          >
            {initialDateTimeRangeOptionsBn.map((option) => (
              <SelectItem key={option.key}>
                {
                  ballotLocale[
                    option.nameKey as keyof typeof ballotLocale
                  ]
                }
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
          <DateRangePicker
            size="md"
            aria-label="Date Range Selector"
            label={ballotLocale.select_date_range}
            labelPlacement="outside"
            showMonthAndYearPickers
            value={createdDateTimeRange}
            onChange={handleCreatedDateTimeRange}
            hideTimeZone
            className="w-full"
            variant="bordered"
            visibleMonths={1}
          />
        </div>
      </div>

      <div className="rounded-lg ">
        {/* Search Row - Simplified for Ballot */}
        <div className="flex justify-between items-center mb-4">
          <div className="w-full md:w-[49%]">
            <Input
              size="md"
              aria-label="Search"
              label={ballotLocale.search}
              labelPlacement="outside"
              placeholder={ballotLocale.search_by_serial_no_outbound_or_inbound_address}
              variant="bordered"
              className="w-full text-postDarkest dark:text-postLightest"
              value={searchValue}
              onValueChange={setSearchValue}
              isClearable
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-1 ">
          <div className="flex justify-between items-center mx-2 my-2">
            <span className="text-default-400 text-small">
             {ballotLocale.total} : {lang==="bn"? e_to_b(filteredBallotRecords.length.toString()):filteredBallotRecords.length} {ballotLocale.ballot_records}
            </span>

            <div className="flex justify-center items-center">
              <label className="flex items-center text-default-400 text-small">
              {ballotLocale.rows_per_page} : {" "}
                <select
                  className="bg-transparent outline-none text-default-400 text-small border border-default-300 dark:border-default-600 rounded ml-1"
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  value={per_page}
                >
                  <option value={5}>{lang==="bn" ? e_to_b("5"):"5"}</option>
                  <option value={10}>{lang==="bn" ? e_to_b("10"):"10"}</option>
                  <option value={15}>{lang==="bn" ? e_to_b("15"):"15"}</option>
                  <option value={20}>{lang==="bn" ? e_to_b("20"):"20"}</option>
                  <option value={50}>{lang==="bn" ? e_to_b("50"):"50"}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="w-full overflow-x-auto shadow-md dark:bg-gray-900 rounded-md p-1">
            <Table
              aria-label="Ballot records table"
              className="overflow-x-scroll"
              isCompact
              isStriped
              removeWrapper
              classNames={{
                th: "bg-[#EDF2F7] dark:bg-gray-800",
                tr: "data-[odd=true]:bg-gray-50 data-[odd=true]:dark:bg-gray-800/50 data-[hover=true]:bg-gray-100 data-[hover=true]:dark:bg-gray-700/50",
                td: "dark:text-gray-200",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => {
                  const tableHeader= ballotLocale[column.name as keyof typeof ballotLocale]||column.name;
                  const tableHeaderText = tableHeader.replace(/_/g, " ").toUpperCase()
                  return(
                  <TableColumn
                    key={column.uid}
                    className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base bg-[#EDF2F7] dark:bg-gray-800"
                  >
                    {tableHeaderText}
                  </TableColumn>
                )}}
              </TableHeader>

              <TableBody
                items={currentRecords}
                emptyContent={
                  <div className="text-center py-8">
                    <p className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">
                      {ballotLocale.no_ballot_data_found}
                    </p>
                  </div>
                }
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base">
                        {RenderCell({
                          ballot: item,
                          columnKey: columnKey,
                          onAction: handleBallotAction,
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center my-4">
            {totalPages > 1 && (
              <Pagination
                isCompact
                showControls
                page={currentPage}
                total={totalPages}
                onChange={(page) => setCurrentPage(page)}
                className="overflow-x-visible"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BallotTable;
