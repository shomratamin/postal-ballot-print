"use client";
import { Locale } from "@/dictionaries/dictionaty";
import { DashboardLocale } from "@/dictionaries/types";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import React from "react";

 

const SystemStatus = ({dashboardLocale,lang}:{dashboardLocale:DashboardLocale; lang:Locale}) => {
  return (
    <div>
      {/* System Status */}
      <Card className="w-full rounded-lg">
        <CardHeader className=" ">
          <p className="text-md font-semibold">{dashboardLocale.system_status}</p>
        </CardHeader>

        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <p className="flex gap-2 text-sm">
              <span>
                <Icon icon="lucide:cloud-lightning" width={20} height={20} />
              </span>
              <span className="text-xs  text-gray-800">KFKA</span>
            </p>
            <p className="flex gap-2 items-center  text-xs text-[#05603A] bg-green-100 rounded-full px-2 ">
            <span> <Icon icon="mdi:circle" width={6} /></span>
              <span className="py-1"> Ready</span>
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="flex gap-2 text-sm">
              <span>
                <Icon icon="lucide:printer" width="20" height="18" />
              </span>
              <span className="text-xs text-gray-800">Priner 1</span>
            </p>
            <p className="flex gap-2 items-center   text-xs text-[#05603A] bg-green-100 rounded-full px-2 ">
             <Icon icon="mdi:circle" width={6} />
              <span className="py-1"> Ready</span>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SystemStatus;
