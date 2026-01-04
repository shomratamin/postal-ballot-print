"use client";

import React from "react";
import DashboardTable from "./DashboardTable";
import SystemStatus from "./SystemStatus";
import RecentActivities from "./RecentActivities";
import DashboardCard from "./DashboardCard";
import { DashboardLocale } from "@/dictionaries/types";
import { Locale } from "@/dictionaries/dictionaty";

const Dashboard = ( {dashboardLocale,lang}:{ dashboardLocale:DashboardLocale; lang:Locale}) => {
  return (
    <div className="w-full px-2 sm:px-4 lg:px-8 py-6 space-y-10">
     
      <div className="w-full grid grid-cols-1 gap-4">
        
        <DashboardCard dashboardLocale={dashboardLocale} lang={lang} />
       
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 w-full">
          <DashboardTable dashboardLocale={dashboardLocale} lang={lang}/>
        </div>

        <div className="lg:col-span-3 w-full space-y-4">
          <SystemStatus dashboardLocale={dashboardLocale} lang={lang}/>
          <RecentActivities dashboardLocale={dashboardLocale} lang={lang}/>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
