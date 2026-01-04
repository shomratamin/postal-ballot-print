"use client";
import Image from "next/image";
import React from "react";
import { Button, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PrintingLocale } from "@/dictionaries/types";
import { useWeightMachine } from "../../app/context/weight-machine-context";

export default function DakjontroBanner({ printingLocale }: { printingLocale: PrintingLocale }) {
    const { isConnected, printerId, showBanner, setShowBanner } = useWeightMachine();

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = '/BPOCloudPrintClientInstaller-v1.0.1.7.exe';
        link.download = 'BPOCloudPrintClientInstaller-v1.0.1.7.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCloseBanner = () => {
        console.log("Closing Dakjontro Banner");
        setShowBanner(false);
    };

    if (!showBanner || isConnected) {
        return null; // Do not render anything if banner is dismissed
    }

    return (
        <div className="border-divider bg-background/5 flex w-full items-center gap-x-2 sm:gap-x-3 border-b-1 px-3 py-2 sm:px-6 backdrop-blur-xl">
            <div className="flex-shrink-0">
                <Image
                    src="/static/images/logo/logo-icon.svg"
                    alt="logo"
                    width={isConnected ? 40 : 40}
                    height={isConnected ? 32 : 32}
                    className="sm:w-[50px] sm:h-[40px]"
                />
            </div>
            <div className="flex-1 min-w-0 text-xs sm:text-small text-foreground">
                {isConnected && printerId ? (
                    <>
                        <span className="text-success block sm:inline">Dakjontro Connected</span>
                        <p className="truncate">Printer ID: <span className="font-mono text-primary">{printerId}</span></p>
                    </>
                ) : (
                    <>
                        <Link className="text-inherit block sm:inline" href="#">
                            {printingLocale.dakjontro_not_installed}
                        </Link>
                        <p className="text-xs ss:hidden xxs:hidden xs:hidden sm:hidden md:block leading-tight">{printingLocale.why_dakjontro}</p>
                    </>
                )}
            </div>
            {!isConnected && (
                <div className="flex-shrink-0 hidden sm:block">
                    <Button
                        className="group text-small relative h-9 overflow-hidden bg-transparent font-normal"
                        color="default"
                        endContent={
                            <Icon
                                className="flex-none transition-transform outline-hidden group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-2"
                                icon="solar:arrow-right-linear"
                                width={16}
                            />
                        }
                        onClick={handleDownload}
                        style={{
                            border: "solid 2px transparent",
                            backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #F871A0, #9353D3)`,
                            backgroundOrigin: "border-box",
                            backgroundClip: "padding-box, border-box",
                        }}
                        variant="bordered"
                    >
                        {printingLocale.download_dakjontro}
                    </Button>
                </div>
            )}
            {!isConnected && (
                <div className="flex-shrink-0 sm:hidden">
                    <Button
                        isIconOnly
                        className="h-8 w-8"
                        color="default"
                        size="sm"
                        onClick={handleDownload}
                        style={{
                            border: "solid 1px transparent",
                            backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #F871A0, #9353D3)`,
                            backgroundOrigin: "border-box",
                            backgroundClip: "padding-box, border-box",
                        }}
                        variant="bordered"
                    >
                        <Icon
                            icon="solar:download-linear"
                            width={16}
                        />
                    </Button>
                </div>
            )}
            <div className="flex-shrink-0">
                <Button isIconOnly className="-m-1" size="sm" variant="light" onClick={handleCloseBanner}>
                    <span className="sr-only">Close Banner</span>
                    <Icon className="text-default-500" icon="lucide:x" width={18} />
                </Button>
            </div>
        </div>
    );
}
