"use client";
import {
    Button,
} from "@heroui/react";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { ArticleLocale, CommonLocale } from "@/dictionaries/types";
import ArticleEventTable from "./ArticleEventTable";
import { Locale } from "@/dictionaries/dictionaty";

const ArticleEventComponent = ({ commonLocale, lang, articleLocale }: { commonLocale: CommonLocale, lang: Locale , articleLocale:ArticleLocale}) => {

    const [selectedTab, setSelectedTab] = useState("view-events");


    return (
        <div className="flex-1 flex-col   xxs:p-2 sm:p-3 md:p-4 lg:p-4">


            <div className="mb-4">
                <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#18C964" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                    </svg>

                    <h2 className="ml-2 text-xl font-semibold mb-4 text-postDark dark:text-postLight">{articleLocale.article_list}</h2>
                </div>

                <div className="flex ss:flex-col xxs:flex-row xs:flex-row sm:flex-row md:flex-row gap-3 ss:gap-2 xxs:gap-2 xs:gap-3 sm:gap-3 md:gap-4">


                    <Button
                        variant={selectedTab === "view-events" ? "solid" : "bordered"}
                        color="primary"
                        size="md"
                        className="ss:w-full xxs:w-auto xs:w-auto sm:w-auto"
                        startContent={
                            selectedTab === "view-events" ? (
                                <Icon icon="solar:check-circle-bold" width={18} />
                            ) : (
                                <Icon icon="solar:database-outline" width={18} />
                            )
                        }
                        onPress={() => setSelectedTab("view-events")}
                    >
                        <span className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">{articleLocale.view_data}</span>
                    </Button>
                    {/* <Button
                        variant={selectedTab === "view-data" ? "solid" : "bordered"}
                        color="primary"
                        size="md"
                        className="ss:w-full xxs:w-auto xs:w-auto sm:w-auto"
                        startContent={
                            selectedTab === "view-data" ? (
                                <Icon icon="solar:check-circle-bold" width={18} />
                            ) : (
                                <Icon icon="solar:database-outline" width={18} />
                            )
                        }
                        onPress={() => setSelectedTab("view-data")}
                    >
                        <span className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">View Data</span>
                    </Button> */}

                    <Button
                        variant={selectedTab === "view-reports" ? "solid" : "bordered"}
                        color="primary"
                        size="md"
                        isDisabled
                        className="ss:w-full xxs:w-auto xs:w-auto sm:w-auto"
                        startContent={
                            selectedTab === "view-reports" ? (
                                <Icon icon="solar:check-circle-bold" width={18} />
                            ) : (
                                <Icon icon="solar:document-add-outline" width={18} />
                            )
                        }
                        onPress={() => setSelectedTab("view-reports")}
                    >
                        <span className="ss:text-sm xxs:text-sm xs:text-base sm:text-base">{articleLocale.generate_report}</span>
                    </Button>
                </div>
            </div>


            {selectedTab === "view-events" && (
                <ArticleEventTable lang={lang} commonLocale={commonLocale} articleLocale={articleLocale} />
            )}

            {/* {selectedTab === "view-reports" && (
        <CorporateTable
          report_type="postal-booking"
          dateTimeRange={createdDateTimeRange}
        />
      )} */}
        </div>
    );
};

export default ArticleEventComponent;