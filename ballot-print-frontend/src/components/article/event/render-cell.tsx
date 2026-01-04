import React, { useState } from "react";
import { Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ArticleEventRow } from "@/lib/store/common/types";
import { CopyText } from "../../common/copy-text";
import { EyeIcon } from "../../common/icons/EyeIcon";

interface Props {
  log: ArticleEventRow;
  columnKey: string | React.Key;
  handleReceiptPrint: (log: ArticleEventRow) => void;
  // handleLabelPrint: (log: ArticleEventRow) => void;
  // handleAdPrint: (log: ArticleEventRow) => void;
  // handleBook: (log: ArticleEventRow) => void;
}

export const RenderCell = ({ log, columnKey, handleReceiptPrint }: Props) => {
  // @ts-ignore
  const cellValue = log[columnKey];

  switch (columnKey) {
    case "barcode":
      return <CopyText>{cellValue || "N/A"}</CopyText>;
    case "id":
      return <CopyText>{cellValue || "N/A"}</CopyText>;
    case "article_id":
      return <CopyText>{cellValue || "N/A"}</CopyText>;

    // case "created_date":
    // const dateValue = log.created_at ? new Date(log.created_at).toLocaleDateString('en-GB') : "N/A";
    // return (
    //   <div className="text-xs">
    //     {dateValue}
    //   </div>
    // );


    case "created_time":
      const dateStr = log.created_at
        ? new Date(log.created_at).toLocaleDateString("en-GB")
        : "N/A";
      const timeStr = log.created_at
        ? new Date(log.created_at).toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        : "N/A";

      return (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {dateStr}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {timeStr}
          </span>
        </div>
      );

    // case "print_status":
    //   if (cellValue === 1) {
    //     return (<Chip color="success">Printed</Chip>)
    //   } else if (cellValue === 2) {
    //     return (<Chip color="danger">Failed</Chip>)
    //   } else {
    //     return (<Chip color="default">Not Printed</Chip>)
    //   }
    // case "status":
    //   let _status: string | number = cellValue || '';
    //   if (cellValue && typeof cellValue === 'string' && cellValue.includes("-")) {
    //     const [phone, status] = cellValue.split("-");
    //     _status = status;
    //   }

    //   // Handle numeric status values first
    //   if (_status == "1" || _status === 1) {
    //     return (<Chip color="primary">Prebooked</Chip>)
    //   }
    //   else if (_status == "2" || _status === 2) {
    //     return (<Chip color="success">Booked</Chip>)
    //   }
    //   else if (_status == "3" || _status === 3) {
    //     return (<Chip color="danger">Failed</Chip>)
    //   }
    //   // Handle string status values
    //   else if (_status == "Pending") {
    //     return (<Chip color="primary">{_status}</Chip>)
    //   }
    //   else if (_status == "Delivered") {
    //     return (<Chip color="success">{_status}</Chip>)
    //   }
    //   else if (_status == "Failed") {
    //     return (<Chip color="danger">{_status}</Chip>)
    //   } else if (_status == "Delivery Pending") {
    //     return (<Chip color="warning">{_status}</Chip>)
    //   } else if (_status == "UnDelivered") {
    //     return (<Chip color="danger">{_status}</Chip>)
    //   }
    //   else if (_status == "No Request found") {
    //     return (<Chip color="danger">{_status}</Chip>)
    //   }
    //   else {
    //     return (
    //       <p className="text-postDark dark:text-postLight">
    //         {_status}
    //       </p>
    //     );
    //   }
    // case "service_type":
    //   let _serviceType: string = cellValue || '';

    //   if (_serviceType == "1") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-md">
    //         <Icon icon="mdi:email" className="text-blue-600" />
    //         <span className="text-blue-800 text-sm">পত্র/চিঠি</span>
    //       </div>
    //     )
    //   }
    //   else if (_serviceType == "2") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-green-100 rounded-md">
    //         <Icon icon="mdi:file-document" className="text-green-600" />
    //         <span className="text-green-800 text-sm">ডকুমেন্ট</span>
    //       </div>
    //     )
    //   }
    //   else if (_serviceType == "3") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-red-100 rounded-md">
    //         <Icon icon="mdi:package-variant" className="text-red-600" />
    //         <span className="text-red-800 text-sm">পার্সেল</span>
    //       </div>
    //     )
    //   } else if (_serviceType == "4") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 rounded-md">
    //         <Icon icon="mdi:flash" className="text-yellow-600" />
    //         <span className="text-yellow-800 text-sm">স্পীড পোস্ট (উইন্ডো ডেলিভারী)</span>
    //       </div>
    //     )
    //   } else if (_serviceType == "5") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 rounded-md">
    //         <Icon icon="mdi:storefront" className="text-purple-600" />
    //         <span className="text-purple-800 text-sm">ডিজিটাল কমার্স (হোম ডেলিভারী)</span>
    //       </div>
    //     )
    //   }
    //   else if (_serviceType == "6") {
    //     return (
    //       <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 rounded-md">
    //         <Icon icon="mdi:book" className="text-orange-600" />
    //         <span className="text-orange-800 text-sm">বুক প্যাকেট (প্রিন্টেড পাবলিকেশনস)</span>
    //       </div>
    //     )
    //   }
    //   else {
    //     return (
    //       <p className="text-postDark dark:text-postLight">
    //         {_serviceType}
    //       </p>
    //     );
    //   }
    case "event_type":
      return (
        <div className="inline-flex items-center">
          <Chip
            size="sm"
            variant="flat"
            className={`
              ${cellValue === "CREATED"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : ""
              }
              ${cellValue === "RECEIVED"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : ""
              }
              ${cellValue === "DISPATCH"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                : ""
              }
              ${cellValue === "DELIVERED"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : ""
              }
              ${cellValue === "RETURNED"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : ""
              }
              ${cellValue === "BOOKED"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : ""
              }
              ${cellValue === "PRINTED"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                : ""
              }
              ${cellValue === "BAGGED"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                : ""
              }
              font-medium text-xs uppercase tracking-wide
            `}
          >
            {cellValue || "Unknown"}
          </Chip>
        </div>
      );
    case "action":
      return (
        <div className="flex items-center gap-2">
          {log.event_type === "BOOKED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReceiptPrint(log);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-md transition-colors"
              title="Print Receipt"
            >
              <Icon icon="mdi:printer" className="w-4 h-4" />
              Receipt
            </button>
          )}
        </div>
      );
    default:
      return (
        <p className="text-postDark dark:text-postLight">{cellValue ?? "-"}</p>
      );
  }
};
