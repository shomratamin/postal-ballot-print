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
import { Icon } from "@iconify/react";


import { Locale } from "@/dictionaries/dictionaty";
import { EnvelopeListLocale } from "@/dictionaries/types";
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali";
import { initialDateTimeRangeOptionsBn } from "@/lib/store/common/store";
import { EnvelopeListRequestParams } from "@/lib/store/envelope/types";
import { useFetchEnvelopeList } from "@/lib/hooks/useFetchEnvelopeList";
import { RenderCell } from "./render-cell";

const columns = [
    { name: "serial_no", uid: "serial_no" },
    { name: "outbound_address", uid: "outbound_address" },
    { name: "inbound_address", uid: "inbound_address" },
    { name: "last_update", uid: "last_update" },
    { name: "status", uid: "status" },
    { name: "action", uid: "action" },
];

const EnvelopeListTable = ({
    lang,
    envelopeListLocale,
}: {
    lang: Locale;
    envelopeListLocale: EnvelopeListLocale;
}) => {
    const access = Cookies.get("access") || "";

    const [selectedOption, setSelectedOption] = useState<Selection>(
        new Set(["daily"])
    );

    const [selectedOptionName, setSelectedOptionName] = useState("daily");

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

    const [queryParams, setQueryParams] = useState<EnvelopeListRequestParams>(
        {
            from_date: "",
            to_date: "",
            page: 1,
            per_page: per_page,
            search: "",
        }
    );

    // Fetch envelope list using the hook
    const { data: envelopeData, isLoading, error } = useFetchEnvelopeList(access, queryParams);

    const envelopes = envelopeData?.data?.envelopes || [];
    const pagination = envelopeData?.data?.pagination;
    const totalPages = pagination?.total_pages || 0;



    // Update search query params when searchValue changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setQueryParams((prev) => ({
                ...prev,
                search: searchValue,
                page: 1, // Reset to first page on search
            }));
            setCurrentPage(1);
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchValue]);

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
    const handleEnvelopeAction = () => {
        // Placeholder for envelope action handling
    };

    const handleRowsPerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1); // Reset to first page when changing rows per page
        setQueryParams((prev) => ({
            ...prev,
            page: 1,
            per_page: value,
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
                        label={envelopeListLocale.select_a_period}
                        labelPlacement="outside"
                        placeholder={envelopeListLocale.select_a_period}
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
                                    envelopeListLocale[
                                    option.nameKey as keyof typeof envelopeListLocale
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
                        label={envelopeListLocale.select_date_range}
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
                            label={envelopeListLocale.search}
                            labelPlacement="outside"
                            placeholder={envelopeListLocale.search_by_serial_no_outbound_or_inbound_address}
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

                        <div className="flex justify-center items-center">
                            <label className="flex items-center text-default-400 text-small">
                                {envelopeListLocale.rows_per_page} : {" "}
                                <select
                                    className="bg-transparent outline-none text-default-400 text-small border border-default-300 dark:border-default-600 rounded ml-1"
                                    onChange={(e) => {
                                        const newPerPage = Number(e.target.value);
                                        setPerPage(newPerPage);
                                        setCurrentPage(1);
                                        setQueryParams((prev) => ({
                                            ...prev,
                                            page: 1,
                                            per_page: newPerPage,
                                        }));
                                    }}
                                    value={per_page}
                                >
                                    <option value={5}>{lang === "bn" ? e_to_b("5") : "5"}</option>
                                    <option value={10}>{lang === "bn" ? e_to_b("10") : "10"}</option>
                                    <option value={15}>{lang === "bn" ? e_to_b("15") : "15"}</option>
                                    <option value={20}>{lang === "bn" ? e_to_b("20") : "20"}</option>
                                    <option value={50}>{lang === "bn" ? e_to_b("50") : "50"}</option>
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
                                    const tableHeader = envelopeListLocale[column.name as keyof typeof envelopeListLocale] || column.name;
                                    const tableHeaderText = tableHeader.replace(/_/g, " ").toUpperCase()
                                    return (
                                        <TableColumn
                                            key={column.uid}
                                            className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base bg-[#EDF2F7] dark:bg-gray-800"
                                        >
                                            {tableHeaderText}
                                        </TableColumn>
                                    )
                                }}
                            </TableHeader>

                            <TableBody
                                items={envelopes}
                                isLoading={isLoading}
                                loadingContent={<Spinner label="Loading..." />}
                                emptyContent={
                                    <div className="text-center py-8">
                                        <p className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">
                                            {envelopeListLocale.no_envelope_data_found}
                                        </p>
                                    </div>
                                }
                            >
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => (
                                            <TableCell className="ss:text-xs xxs:text-xs xs:text-sm sm:text-sm md:text-base">
                                                {RenderCell({
                                                    envelope: item,
                                                    columnKey: columnKey,
                                                    onAction: handleEnvelopeAction,
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

export default EnvelopeListTable;
