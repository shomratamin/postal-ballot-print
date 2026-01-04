"use client";
import { Button, Tooltip } from "@heroui/react";
import React, { forwardRef, memo, useMemo } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

export interface CopyTextProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  textClassName?: string;
  copyText?: string;
  children: string;
}

export const CopyText = memo(
  forwardRef<HTMLDivElement, CopyTextProps>((props, forwardedRef) => {
    const { className, textClassName, children, copyText = "Copy" } = props;
    const [copied, setCopied] = React.useState(false);
    const [copyTimeout, setCopyTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const onClearTimeout = () => {
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
    };

    const handleClick = () => {
      onClearTimeout();

      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(children)
          .then(() => {
            setCopied(true);
            setCopyTimeout(
              setTimeout(() => {
                setCopied(false);
              }, 3000),
            );
          })
          .catch((err) => {
            console.error('Failed to copy text: ', err);
            // Fallback to legacy method
            fallbackCopyTextToClipboard(children);
          });
      } else {
        // Fallback for browsers that don't support clipboard API
        fallbackCopyTextToClipboard(children);
      }
    };

    const fallbackCopyTextToClipboard = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setCopyTimeout(
            setTimeout(() => {
              setCopied(false);
            }, 3000),
          );
        }
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }

      document.body.removeChild(textArea);
    };

    const content = useMemo(() => (copied ? "Copied" : copyText), [copied, copyText]);

    return (
      <div ref={forwardedRef} className={cn("flex items-center gap-3 text-default-500", className)}>
        <span className={textClassName}>{children}</span>
        <div className="relative">
          <Tooltip className="text-foreground" content={content}>
            <Button
              isIconOnly
              className="h-7 w-7 min-w-7 text-default-400"
              size="sm"
              variant="light"
              onPress={handleClick}
            >
              {!copied && <Icon className="h-[14px] w-[14px]" icon="solar:copy-linear" />}
              {copied && <Icon className="h-[14px] w-[14px]" icon="solar:check-read-linear" />}
            </Button>
          </Tooltip>
          {copied && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
              Copied!
            </div>
          )}
        </div>
      </div>
    );
  }),
);

CopyText.displayName = "CopyText";
