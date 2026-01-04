"use client";
import { Button, Avatar, Tabs, Tab } from "@heroui/react";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import ProfileSetting from "./profile-setting";
import AccountSetting from "./account-setting";
import BillingSetting from "./billing-setting";
import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { Branch } from "@/lib/store/common/types";
import { ProfileLocale } from "@/dictionaries/types";


export interface ProfileComponentProps {
  user: VerifiedUser | null;
  branch: Branch | null;
  profileLocale: ProfileLocale;
}

export default function ProfileComponent({
  user,
  branch,
  profileLocale,
}: ProfileComponentProps) {
  // console.log("user data >>>", user);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="md:w-full px-5 lg:w-full xl:max-w-[68%] xl:mx-auto">


      <div className="w-full flex-1">

        {/*  Tabs */}
        <Tabs
          fullWidth
          classNames={{
            base: "mt-6",
            cursor: "bg-content1 dark:bg-content1",
            panel: "w-full p-0",
          }}
        >
          <Tab key="profile" title={profileLocale.profile}>
            <ProfileSetting user={user} branch={branch} profileLocale={profileLocale} />
          </Tab>

          <Tab key="account" title={profileLocale.security}>
            <AccountSetting profileLocale={profileLocale} />
          </Tab>
          {/* <Tab key="billing" title="Billing">
            <BillingSetting />
          </Tab>  */}
        </Tabs>
      </div>
    </div>
  );
}
