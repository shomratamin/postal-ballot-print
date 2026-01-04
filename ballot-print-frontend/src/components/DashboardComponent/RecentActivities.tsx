"use client";
import { Card, CardBody, CardHeader } from "@heroui/react";
import React from "react";
import { Icon } from "@iconify/react";
import { DashboardLocale } from "@/dictionaries/types";
import { Locale } from "@/dictionaries/dictionaty";

type Props = {};

const RecentActivities = ({dashboardLocale,lang}:{dashboardLocale:DashboardLocale; lang:Locale}) => {
  return (
    <div className="mt-6">
      <Card className="w-full rounded-lg">
        <CardHeader className="flex gap-3">
          <p className="text-md font-semibold">{dashboardLocale.recent_activities}</p>
        </CardHeader>

        <CardBody>
          <div className="flex justify-between">
            <p className="flex gap-2 text-xs items-center">
              <span>
                <Icon icon="lucide:clipboard-list" width={20} height={18} />
              </span>
              <span className="text-gray-700">
                Created batch 0000010 with 100 voters
              </span>
            </p>
            <span>
              <Icon icon="lucide:eye" width={20} height={18} color="#1570EF" />
            </span>
          </div>
          <div className="flex justify-between py-5">
            <p className="flex gap-2 text-xs items-center">
              <span>
                <Icon icon="lucide:printer" width="20" height="18" />
              </span>
              <span className="text-gray-700">
                Created batch 0000010 with 100 voters
              </span>
            </p>
            <span>
              <Icon icon="lucide:eye" width={20} height={18} color="#1570EF" />
            </span>
          </div>
          <div className="flex justify-between">
            <p className="flex gap-2 text-xs items-center">
              <span>
                <Icon icon="lucide:refresh-cw" width={20} height={18} />
              </span>
              <span className="text-gray-700">
                Requested data70000011 from OCV-SDI database
              </span>
            </p>
            <span>
              <Icon icon="lucide:eye" width={20} height={18} color="#1570EF" />
            </span>
          </div>
          <div className="flex justify-between py-5">
            <p className="flex gap-2 text-xs items-center">
              <span>
                <Icon icon="lucide:alert-triangle" width={20} height={18} />
              </span>
              <span className="text-gray-700">
                Print error during 0000011 batch printing
              </span>
            </p>
            <span>
              <Icon icon="lucide:eye" width={20} height={18} color="#1570EF" />
            </span>
          </div>
          <div className="flex justify-between">
            <p className="flex gap-2 text-xs items-center">
              <span>
                <Icon icon="lucide:refresh-cw" width={20} height={18} />
              </span>
              <span className="text-gray-700">
                Requested data70000011 from OCV-SDI database
              </span>
            </p>
            <span>
              <Icon icon="lucide:eye" width={20} height={18} color="#1570EF" />
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default RecentActivities;
