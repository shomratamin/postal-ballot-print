"use client"

import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { useWeightMachine } from "@/src/app/context/weight-machine-context";

const ServiceRoleContent = ({ user }: { user: VerifiedUser }) => {

    const { isConnected, printerId, showBanner, setShowBanner } = useWeightMachine();
    // Function to determine user's main service and role based on permissions
    const getUserServiceAndRole = () => {
        if (!user.permissions || user.permissions.length === 0) {
            return { service: 'Unknown', role: 'Unknown' };
        }

        // Filter out dms-core-legacy-sql-query permissions from all processing
        const filteredPermissions = user.permissions.filter(permission =>
            !permission.startsWith('dms-core-legacy-sql-query.')
        );

        // Check for RMS permissions
        const rmsPermission = filteredPermissions.find(permission =>
            permission.startsWith('rms.')
        );
        if (rmsPermission) {
            const role = rmsPermission.split('.')[1]; // Extract role between 'rms.' and '.full-permit'
            return { service: 'RMS', role: role.charAt(0).toUpperCase() + role.slice(1) };
        }

        // Check for DMS permissions (including dms-accounting)
        const dmsPermission = filteredPermissions.find(permission =>
            permission.startsWith('dms.') || permission.startsWith('dms-accounting.')
        );
        if (dmsPermission) {
            const role = dmsPermission.split('.')[1]; // Extract role between 'dms.' and '.full-permit'
            return { service: 'DMS', role: role.charAt(0).toUpperCase() + role.slice(1) };
        }

        // Check for Ekdak permissions
        const ekdakPermission = filteredPermissions.find(permission =>
            permission.startsWith('ekdak.')
        );
        if (ekdakPermission) {
            const role = ekdakPermission.split('.')[1]; // Extract role between 'ekdak.' and '.full-permit'
            return { service: 'Ekdak', role: role.charAt(0).toUpperCase() + role.slice(1) };
        }

        // If no main service permission found, return general info
        return { service: 'General', role: 'User' };
    }

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
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{service}</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isConnected
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-red-100 dark:bg-red-900'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                    <span className={`text-xs font-medium ${isConnected
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                        }`}>{role}</span>
                </div>
            </div>
        </>






    );
};

export default ServiceRoleContent;