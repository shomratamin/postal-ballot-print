import React, { useState } from "react";
import { Chip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Envelope } from "@/lib/store/envelope/types";

interface Props {
    envelope: Envelope;
    columnKey: string | React.Key;
    onAction?: (envelope: Envelope, actionType: string) => void;
}

export const RenderCell = ({ envelope, columnKey, onAction }: Props) => {
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    switch (columnKey) {
        case "serial_no":
            return (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {envelope.sequence}
                    </span>
                </div>
            );

        case "outbound_address":
            const outboundAddress = envelope.address;
            return (
                <div className="flex flex-col max-w-xs">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {outboundAddress.recipient_fore_name} {outboundAddress.recipient_other_name}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {outboundAddress.postal_address}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {outboundAddress.city}, {outboundAddress.zip_code}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {outboundAddress.phone_no}
                    </span>
                </div>
            );

        case "inbound_address":
            const inboundAddress = envelope.returning_address;
            return (
                <div className="flex flex-col max-w-xs">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {inboundAddress.district_head_post_office}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {inboundAddress.district}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {inboundAddress.zip_code}
                    </span>
                </div>
            );

        case "last_update":
            return (
                <div className="flex flex-col">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(envelope.updated_at)}
                    </span>
                </div>
            );

        case "status":
            // Default status based on is_deleted field
            const status = envelope.is_deleted ? "Deleted" : "Active";
            const getStatusColor = (
                status: string
            ): "success" | "danger" | "warning" | "default" => {
                switch (status.toLowerCase()) {
                    case "active":
                        return "success";
                    case "deleted":
                        return "danger";
                    case "pending":
                        return "warning";
                    default:
                        return "default";
                }
            };

            return (
                <Chip
                    color={getStatusColor(status)}
                    variant="flat"
                    size="sm"
                    className="font-medium"
                >
                    {status}
                </Chip>
            );

        case "action":
            return (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isIconOnly
                        onClick={() => onAction?.(envelope, "view")}
                    >
                        <Icon icon="lucide:eye" width={16} />
                    </Button>
                    <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        isIconOnly
                        onClick={() => onAction?.(envelope, "print")}
                    >
                        <Icon icon="lucide:printer" width={16} />
                    </Button>
                </div>
            );

        default:
            return (
                <p className="text-postDark dark:text-postLight text-sm">
                    -
                </p>
            );
    }
};
