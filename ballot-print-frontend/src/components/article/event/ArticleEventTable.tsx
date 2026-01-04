"use client";

import {
  Button,
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
  Card,
  DateRangePicker,
} from "@heroui/react";
import { Spinner } from "@heroui/react";
import React, { useEffect, useState } from "react";
import {
  getLocalTimeZone,
  parseZonedDateTime,
  ZonedDateTime,
} from "@internationalized/date";
import Cookies from "js-cookie";
import { RenderCell } from "./render-cell";
import { Icon } from "@iconify/react";
import {
  ArticleEventListRequestParams,
  ArticleEventRow,
  initialDateTimeRangeOptions,
} from "@/lib/store/common/types";
import { useGetArticleEvent } from "@/lib/hooks/useGetArticleEvent";
import { Locale } from "@/dictionaries/dictionaty";
import { ArticleLocale, CommonLocale } from "@/dictionaries/types";
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali";
import { initialDateTimeRangeOptionsBn } from "@/lib/store/common/store";
import { useWeightMachine } from "@/src/app/context/weight-machine-context";
import { useDmsPrintArticle } from "@/lib/hooks/useDmsPrintArticle";
import { DmsPrintJobRequest, DmsPrintJobResponse } from "@/lib/store/post/types";

const columns = [
  // { name: "Id", uid: "id" },
  { name: "article_id", uid: "article_id" },
  { name: "barcode", uid: "barcode" },
  { name: "ad_barcode", uid: "ad_barcode" },
  { name: "insurance_price", uid: "insurance_price" },
  { name: "service_charge", uid: "service_charge" },
  { name: "service_type", uid: "service_type" },
  { name: "vas_type", uid: "vas_type" },
  { name: "vat", uid: "vat" },
  { name: "event_type", uid: "event_type" },
  // { name: "Instruction", uid: "instruction" },
  { name: "creation_branch", uid: "creation_branch" },
  { name: "destination_branch", uid: "destination_branch" },
  { name: "created_by", uid: "created_by" },
  { name: "date_time", uid: "created_at" },
  { name: "action", uid: "action" },
];

const ArticleEventTable = ({
  lang,
  commonLocale,
  articleLocale,
}: {
  lang: Locale;
  commonLocale: CommonLocale;
  articleLocale: ArticleLocale;
}) => {
  const access = Cookies.get("access") || "";

  const { isConnected, printerId, showBanner, setShowBanner, weightDimData } = useWeightMachine();
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
      }
    };

    printDmsArticle(receipt_job_transformed, {
      onSuccess: (res: DmsPrintJobResponse) => {
        console.log("Receipt Print job sent successfully", res);
        if (res.status === "success" || res.status === "already-printed") {
          // Handle success - you can add notification here
          console.log("Receipt printed successfully for barcode:", article_data.barcode);
        }
      },
      onError: (error) => {
        console.error("Error sending receipt print job:", error);
        // Handle error - you can add notification here
      }
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

  const [selectedStatus, setSelectedStatus] = useState<Selection>(new Set(["BOOKED"]));

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

  const {
    data,
    error,
    isLoading: isLoadingArticleEventData,
  } = useGetArticleEvent(access, queryParams);

  let initial_reports: ArticleEventRow[] = [];
  const reports = Array.isArray(data?.data) ? data.data : initial_reports;
  console.log("article event reports", data);
  const total = data?.total_items || 0;

  const is_pagination_show =
    !isLoadingArticleEventData &&
    Array.isArray(data?.data) &&
    data.data.length > 0;

  // Helper function to get selected articles
  const getSelectedArticles = () => {
    if (selectedArticleKeys === "all") {
      return reports;
    }
    if (selectedArticleKeys instanceof Set) {
      return reports.filter((article) =>
        selectedArticleKeys.has(article.id.toString())
      );
    }
    return [];
  };
  // Generate PDF Report function
  const generatePDFReport = () => {
    const selectedArticles = getSelectedArticles();

    if (selectedArticles.length === 0) {
      alert("Please select at least one article to generate the report.");
      return;
    }

    // Create a new window with the report content
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      alert("Please allow popups to generate the report.");
      return;
    }

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Article Events Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 20px;
          }
          .logo {
            height: 50px;
            width: auto;
            flex-shrink: 0;
          }
          .title-section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
          }
          .report-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 3px 0;
          }
          .report-date {
            font-size: 12px;
            color: #666;
            margin: 2px 0;
          }
          .event-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .event-type.created { background-color: #e6f7ff; color: #1890ff; }
          .event-type.received { background-color: #f6ffed; color: #52c41a; }
          .event-type.dispatch { background-color: #fff7e6; color: #fa8c16; }
          .event-type.delivered { background-color: #f6ffed; color: #52c41a; }
          .event-type.returned { background-color: #fff2f0; color: #ff4d4f; }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
          }
          .summary-table th,
          .summary-table td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            text-align: left;
          }
          .summary-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .summary-table tbody tr:nth-child(even) {
            background-color: #fafafa;
          }
          @media print {
            body { margin: 10px; font-size: 10px; }
            .summary-table { font-size: 9px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/static/images/logo/logo-post-light.svg" alt="Logo" class="logo" />
          <div class="title-section">
            <div class="report-title">Article Events Report</div>
            <div class="report-date">Generated on: ${new Date().toLocaleString()}</div>
            <div class="report-date">Total Articles: ${selectedArticles.length
      }</div>
            <div class="report-date">Date Range: ${createdDateTimeRange?.start
        ? formatDateForAPI(createdDateTimeRange.start)
        : "All"
      } to ${createdDateTimeRange?.end
        ? formatDateForAPI(createdDateTimeRange.end)
        : "All"
      }</div>
          </div>
        </div>

        <!-- Summary Table -->
        <table class="summary-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Barcode</th>
              <th>AD</th>
              <th>Event</th>
              <th>Service</th>
              <th>VAS</th>
              <th>Insurance</th>
              <th>Charge</th>
              <th>VAT</th>
              <th>Created At</th>
              <th>Destination</th>
              <th>Created By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${selectedArticles
        .map(
          (article) => `
              <tr>
                <td>${article.id}</td>
                <td>${article.barcode}</td>
                <td>${article.ad_barcode || "N/A"}</td>
                <td>
                  <span class="event-type ${article.event_type
              .toLowerCase()
              .replace(/\s+/g, "-")}">
                    ${article.event_type}
                  </span>
                </td>
                <td>${article.service_type || "N/A"}</td>
                <td>${article.vas_type || "N/A"}</td>
                <td>${article.insurance_price || "0"}</td>
                <td>${article.service_charge || "0"}</td>
                <td>${article.vat || "0"}</td>
                <td>${article.creation_branch || "N/A"}</td>
                <td>${article.destination_branch || "N/A"}</td>
                <td>${article.created_by || "N/A"}</td>
                <td>${article.created_at}</td>
              </tr>
            `
        )
        .join("")}
          </tbody>
        </table>
        
        <script>
          // Auto-trigger print dialog
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

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
            label={articleLocale.select_a_period}
            labelPlacement="outside"
            placeholder={articleLocale.select_a_period}
            selectedKeys={selectedOption}
            className="w-full text-default-400"
            classNames={{
              popoverContent: "text-postDarkest dark:text-postLightest",
            }}
            onSelectionChange={handleSelectedOption}
          >
            {initialDateTimeRangeOptionsBn.map((option) => (
              <SelectItem key={option.key}>
                {articleLocale[option.nameKey as keyof typeof articleLocale]}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
          <DateRangePicker
            size="md"
            aria-label="Date Range Selector"
            label={articleLocale.select_date_range}
            labelPlacement="outside"
            showMonthAndYearPickers
            value={createdDateTimeRange}
            onChange={handleCreatedDateTimeRange}
            hideTimeZone
            className="w-full  "
            variant="bordered"
            visibleMonths={1}
          />
        </div>
      </div>

      <div className="rounded-lg ">
        {/* Search and Service Filter Row */}
        <div className="ss:flex-col xxs:flex-col xs:flex-col sm:flex-col md:flex-row lg:flex-row xl:flex-row 2xl:flex-row flex justify-between items-center ss:gap-2 xxs:gap-2 xs:gap-3 sm:gap-3 md:gap-4 mb-2">
          <div className="ss:w-full xxs:w-full xs:w-full sm:w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
            <Input
              size="md"
              aria-label="Search"
              label={articleLocale.search}
              labelPlacement="outside"
              placeholder={articleLocale.search_by_barcode}
              variant="bordered"
              className="w-full text-postDarkest dark:text-postLightest"
              value={searchValue}
              onValueChange={handleSearchValue}
              isClearable
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
            />
          </div>
          <div className="ss:w-full xxs:w-full xs:w-full sm:w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
            <Select
              size="md"
              aria-label="Select Service Type"
              variant="bordered"
              label={articleLocale.select_service_type}
              labelPlacement="outside"
              placeholder={articleLocale.service_type}
              selectedKeys={selectedServiceType}
              className="w-full text-default-400"
              classNames={{
                popoverContent: "text-postDarkest dark:text-postLightest",
              }}
              onSelectionChange={handleSelectedServiceType}
            >
              <SelectItem key="DL">{articleLocale.letter}</SelectItem>
              <SelectItem key="DD">{articleLocale.document}</SelectItem>
              <SelectItem key="DP">{articleLocale.parcel}</SelectItem>
              <SelectItem key="DS">{articleLocale.speed_post}</SelectItem>
              <SelectItem key="DC">{articleLocale.digital_commerce}</SelectItem>
              <SelectItem key="DB">{articleLocale.book_packet}</SelectItem>
              <SelectItem key="DG">{articleLocale.gep}</SelectItem>
            </Select>
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex md:justify-between items-center  ss:flex-col xxs:flex-col xs:flex-col sm:flex-col md:flex-row   ss:gap-2 xxs:gap-2 xs:gap-3 sm:gap-3 md:gap-4">
          <div className="ss:w-full xxs:w-full xs:w-full sm:w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%]">
            <Select
              size="md"
              aria-label="Booking Status"
              variant="bordered"
              label={articleLocale.select_booking_status}
              labelPlacement="outside"
              placeholder={articleLocale.select_booking_status}
              selectedKeys={selectedStatus}
              className="w-full text-default-400"
              classNames={{
                popoverContent: "text-postDarkest dark:text-postLightest",
              }}
              onSelectionChange={handleSelectedStatus}
            >
              <SelectItem key="CREATED">{articleLocale.pre_booked}</SelectItem>
              <SelectItem key="PRINTED">{articleLocale.printed}</SelectItem>
              <SelectItem key="PRINT_FAILED">
                {articleLocale.print_failed}
              </SelectItem>
              <SelectItem key="AD_PRINTED">
                {articleLocale.ad_printed}
              </SelectItem>
              <SelectItem key="AD_PRINT_FAILED">
                {articleLocale.ad_print_failed}
              </SelectItem>
              <SelectItem key="RECEIPT_PRINTED">
                {articleLocale.receipt_printed}
              </SelectItem>
              <SelectItem key="RECEIPT_PRINT_FAILED">
                {articleLocale.receipt_print_failed}
              </SelectItem>
              <SelectItem key="BOOKED">{articleLocale.booked}</SelectItem>
              <SelectItem key="BOOKING_FAILED">
                {articleLocale.booking_failed}
              </SelectItem>
              <SelectItem key="BAGGED">{articleLocale.bagged}</SelectItem>
              <SelectItem key="RECEIVED">{articleLocale.received}</SelectItem>
              <SelectItem key="FORWARDED">{articleLocale.forwarded}</SelectItem>
              <SelectItem key="UNBAGGED">{articleLocale.unbagged}</SelectItem>
              <SelectItem key="DELIVERED">{articleLocale.delivered}</SelectItem>
              <SelectItem key="RETURN_CREATED">
                {articleLocale.return_created}
              </SelectItem>
              <SelectItem key="RETURN_DELIVERED">
                {articleLocale.delivered}
              </SelectItem>
            </Select>
          </div>
          <div className="ss:w-full xxs:w-full xs:w-full sm:w-full md:w-[49%] lg:w-[49%] xl:w-[49%] 2xl:w-[49%] md:flex md:justify-end mt-1">
            {isMounted &&
              selectedArticleKeys &&
              (selectedArticleKeys === "all" ||
                (selectedArticleKeys instanceof Set &&
                  selectedArticleKeys.size > 0)) && (
                <Button
                  size="md"
                  color="primary"
                  variant="solid"
                  onPress={generatePDFReport}
                  startContent={
                    <Icon
                      icon="heroicons:document-arrow-down"
                      className="w-4 h-4"
                    />
                  }
                  className="font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out rounded-xl"
                >
                  {lang === "bn" ? "রিপোর্ট তৈরি করুন" : "Generate Report"}(
                  {selectedArticleKeys === "all"
                    ? reports.length
                    : (selectedArticleKeys as Set<string>).size - 1}
                  )
                </Button>
              )}
          </div>
        </div>

        <div className="w-full grid grid-cols-1 ">
          <div className="flex justify-between items-center mx-2 my-2">
            <span className="text-default-400 text-small">
              {articleLocale.total} :{" "}
              {lang === "bn" ? e_to_b(total.toString()) : total}{" "}
              {articleLocale.booking_events}
            </span>


            <div className="flex justify-center items-center">
              <label className="flex items-center text-default-400 text-small">
                {articleLocale.rows_per_page} : {" "}
                <select
                  className="bg-transparent outline-none text-default-400 text-small border border-default-300 dark:border-default-600 rounded ml-1"
                  onChange={(e) =>
                    handleRowsPerPageChange(Number(e.target.value))
                  }
                  value={queryParams.page_size || 10}
                >
                  <option value={5}>{lang === "bn" ? e_to_b("5") : "5"}</option>
                  <option value={10}>
                    {lang === "bn" ? e_to_b("10") : "10"}
                  </option>
                  <option value={15}>
                    {lang === "bn" ? e_to_b("15") : "15"}
                  </option>
                  <option value={20}>
                    {lang === "bn" ? e_to_b("20") : "20"}
                  </option>
                  <option value={50}>
                    {lang === "bn" ? e_to_b("50") : "50"}
                  </option>
                  <option value={100}>
                    {lang === "bn" ? e_to_b("80") : "80"}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div className="w-full overflow-x-auto shadow-md dark:bg-gray-900 rounded-md p-1">
            <Table
              aria-label="Internal booking reports table"
              className="overflow-x-scroll"
              isCompact
              isStriped
              removeWrapper
              selectionMode={isMounted ? "multiple" : "none"}
              selectedKeys={isMounted ? selectedArticleKeys : new Set()}
              onSelectionChange={isMounted ? setSelectedArticleKeys : undefined}
              classNames={{
                th: "bg-[#EDF2F7] dark:bg-gray-800",
                tr: "data-[odd=true]:bg-gray-50 data-[odd=true]:dark:bg-gray-800/50 data-[hover=true]:bg-gray-100 data-[hover=true]:dark:bg-gray-700/50",
                td: "dark:text-gray-200",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => {
                  const tableHeader =
                    articleLocale[column.name as keyof typeof articleLocale] ||
                    column.name;
                  const tableHeaderText = tableHeader
                    .replace(/_/g, " ")
                    .toUpperCase();

                  return (
                    <TableColumn
                      key={column.uid}
                      className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base bg-[#EDF2F7] dark:bg-gray-800"
                    >
                      {tableHeaderText}
                    </TableColumn>
                  );
                }}
              </TableHeader>

              <TableBody
                items={reports}
                isLoading={isLoadingArticleEventData}
                // isLoading={Boolean(isLoadingInternalData ?? true)}
                loadingContent={<Spinner className="mt-6" />}
                emptyContent={
                  <div className="text-center py-8">
                    <p className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">
                      {articleLocale.no_data_found}{" "}
                      {formatDateToServerFormat(createdDateTimeRange.start)}{" "}
                      {articleLocale.to}{" "}
                      {formatDateToServerFormat(createdDateTimeRange.end)}
                    </p>
                  </div>
                }
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base">
                        {RenderCell({
                          log: item,
                          columnKey: columnKey,
                          handleReceiptPrint: handleReceiptPrint,
                          // handleLabelPrint: handleLabelPrint,
                          // handleAdPrint: handleAdPrint,
                          // handleBook: handleBook,
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center my-4">
            {is_pagination_show && (
              <Pagination
                isCompact
                showControls
                page={queryParams.page || 1}
                total={data?.total_pages || 0}
                onChange={handlePageChange}
                className="overflow-x-visible"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEventTable;
