"use client";

import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { useWeightMachine } from "@/src/app/context/weight-machine-context";

const ServiceRoleContent = ({ user }: { user: VerifiedUser }) => {
  const { isConnected, printerId, showBanner, setShowBanner } =
    useWeightMachine();
  // Function to determine user's main service and role based on permissions
  const getUserServiceAndRole = () => {
    if (!user.permissions || user.permissions.length === 0) {
      return { service: "Unknown", role: "Unknown" };
    }

    // If no main service permission found, return general info
    return { service: "", role: user.user_role };
  };

  const { service, role } = getUserServiceAndRole();
  // const handleDownload = () => {
  //     const link = document.createElement('a');
  //     link.href = '/BPOCloudPrintClientInstaller-v1.0.1.7.exe';
  //     link.download = 'BPOCloudPrintClientInstaller-v1.0.1.7.exe';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  // };

  return (
    <>
      <p className="font-semibold text-dark">{user.username}</p>
      <div className="flex items-center gap-2">

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full ${isConnected
            ? "bg-green-100 dark:bg-green-900"
            : "bg-red-100 dark:bg-red-900"
            }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
              }`}
          ></div>
          <span
            className={`text-xs font-medium ${isConnected
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
              }`}
          >
            {role}
          </span>
        </div>
      </div>
    </>
  );
};

export default ServiceRoleContent;
