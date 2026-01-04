import React, { useState } from "react";
import { Chip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface BallotRow {
  id: number;
  serial_no: string;
  outbound_address: string;
  inbound_address: string;
  last_update: string;
  status: string;
  action: string;
}

interface Props {
  ballot: BallotRow;
  columnKey: string | React.Key;
  onAction?: (ballot: BallotRow, actionType: string) => void;
}

export const RenderCell = ({ ballot, columnKey, onAction }: Props) => {
  // @ts-ignore
  const cellValue = ballot[columnKey];

  switch (columnKey) {
    case "serial_no":
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {cellValue}
          </span>
        </div>
      );

    case "outbound_address":
      return (
        <div className="flex flex-col max-w-xs">
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {cellValue}
          </span>
        </div>
      );

    case "inbound_address":
      return (
        <div className="flex flex-col max-w-xs">
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {cellValue}
          </span>
        </div>
      );

    case "last_update":
      return (
        <div className="flex flex-col">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cellValue}
          </span>
        </div>
      );

    case "status":
      const getStatusColor = (
        status: string
      ): "success" | "danger" | "warning" | "default" => {
        switch (status.toLowerCase()) {
          case "printed":
            return "success";
          case "not printed":
            return "warning";
          case "error list":
            return "danger";
          case "reprint":
            return "default";
          default:
            return "default";
        }
      };

      return (
        <Chip
          color={getStatusColor(cellValue)}
          variant="flat"
          size="sm"
          className="font-medium"
        >
          {cellValue}
        </Chip>
      );

    case "action":
      const getActionButton = (actionType: string) => {
        switch (actionType.toLowerCase()) {
          case "view":
            return (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:eye" width={16} />}
                onClick={() => onAction?.(ballot, "view")}
              >
                View
              </Button>
            );
          case "print":
            return (
              <Button
                size="sm"
                color="success"
                variant="flat"
                startContent={<Icon icon="lucide:printer" width={16} />}
                onClick={() => onAction?.(ballot, "print")}
              >
                Print
              </Button>
            );
          case "retry":
            return (
              <Button
                size="sm"
                color="warning"
                variant="flat"
                startContent={<Icon icon="lucide:refresh-cw" width={16} />}
                onClick={() => onAction?.(ballot, "retry")}
              >
                Retry
              </Button>
            );
          case "reprint":
            return (
              <Button
                size="sm"
                color="default"
                variant="flat"
                startContent={<Icon icon="lucide:printer" width={16} />}
                onClick={() => onAction?.(ballot, "reprint")}
              >
                RePrint
              </Button>
            );
          default:
            return <span className="text-sm">{cellValue}</span>;
        }
      };

      return getActionButton(cellValue);

    default:
      return (
        <p className="text-postDark dark:text-postLight text-sm">
          {cellValue ?? "-"}
        </p>
      );
  }
};
