"use client"
import React from "react";

export type CellValueProps = React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    value: React.ReactNode;
};

const CellValue = React.forwardRef<HTMLDivElement, CellValueProps>(
    ({ label, value, children, ...props }, ref) => (
        <div ref={ref} className="flex items-center justify-between py-2" {...props}>
            <div className="text-small text-postDarkest dark:text-postLightest">{label}</div>
            <div className="text-small font-medium text-postDarkest dark:text-postLightest">{value || children}</div>
        </div>
    ),
);

CellValue.displayName = "CellValue";

export default CellValue;