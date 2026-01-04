
import { Icon } from "@iconify/react";
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali";
import { Locale } from "@/dictionaries/dictionaty";
import { Chip } from "@heroui/react";


export const renderCell = ({
  batchTableData,
  columnKey,
}: any) => {
  switch (columnKey) {
    // case "sl":
    //   return (
    //     <div className="text-center font-medium">
    //       {/* {lang === "bn"
    //         ? e_to_b((startIndex + index + 1).toString())
    //         : startIndex + index + 1} */}
    //       {  (startIndex + index + 1).toString()}
    //     </div>
    //   );
    case "batch":
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm ">{batchTableData.batch}</span>
        </div>
      );
    case "serial_no":
      return (
        <div className="flex items-center justify-center gap-2">
          <div className=" flex items-center justify-center text-sm">
            {batchTableData.serialNo}
          </div>
        </div>
      );
    case "total_voter":
      return (
        <div className="flex flex-col items-center ">
          <span className="text-sm font-medium">{batchTableData.totalVoter}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {batchTableData.address}
          </span>
        </div>
      );
    case "last_update":
      return (
        <div className="text-center py-2">
          <span className="text-sm">{batchTableData.lastUpdate}</span>
        </div>
      );
    case "status":
      const getStatusColor = (status: string): "success" | "danger" | "warning" | "primary" | "default" => {
        const statusLower = status?.toLowerCase() || "";
        if (statusLower.includes("printed") || statusLower.includes("completed") || statusLower.includes("delivered")) {
          return "success";
        } else if (statusLower.includes("error") || statusLower.includes("failed")) {
          return "danger";
        } else if (statusLower.includes("pending") || statusLower.includes("not printed")) {
          return "warning";
        } else if (statusLower.includes("processing") || statusLower.includes("reprint")) {
          return "primary";
        }
        return "default";
      };

      return (
        <div className="flex flex-col items-center gap-1">
          <Chip 
            color={getStatusColor(batchTableData.status)} 
            variant="flat"
            size="sm"
            className="font-medium"
          >
            {batchTableData.status}
          </Chip>
          {batchTableData.delivery_phone && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {batchTableData.delivery_phone}
            </span>
          )}
        </div>
      );

    // case "actions":
    //   return (
    //     <div className="flex items-center justify-center gap-2">
    //       <button
    //         className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
    //         title="View Details"
    //       >
    //         <Icon icon="lucide:eye" width={18} />
    //       </button>
    //       <button
    //         className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
    //         title="Edit"
    //       >
    //         <Icon icon="lucide:edit" width={18} />
    //       </button>
    //     </div>
    //   );
    default:
      return null;
  }
};
