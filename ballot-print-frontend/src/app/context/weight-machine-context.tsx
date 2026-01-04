"use client";
import { createContext, useContext } from 'react';

// Types for the API responses
export interface MachineIdResponse {
    Message: string;
    Status: string;
}

export interface WeightDimResponse {
    Tid: string;
    Length: string;
    Width: string;
    Height: string;
    VolWt: string;
    GrossWt: string;
    NetWt: string;
    TareWt: string;
    ChrgWt: string;
    FwVer: string;
    MachineID: string;
    PrinterID: string;
    Event: string;
    Status: string;
}

export interface WeightMachineContextType {
    isConnected: boolean;
    printerId: string | null;
    weightDimData: WeightDimResponse | null;
    isLoading: boolean;
    error: string | null;
    checkConnection: () => Promise<void>;
    getWeightDimData: () => Promise<void>;
    showBanner: boolean;
    setShowBanner: (show: boolean) => void;
}

const WeightMachineContext = createContext<WeightMachineContextType | undefined>(undefined);

export const useWeightMachine = () => {
    const context = useContext(WeightMachineContext);
    if (context === undefined) {
        throw new Error('useWeightMachine must be used within a WeightMachineProvider');
    }
    return context;
};

// // Utility functions for localStorage/cookie management
// export const setPrinterIdToStorage = (printerId: string) => {
//     if (typeof window !== 'undefined') {
//         localStorage.setItem('dakjontro_printer_id', printerId);
//         // Also set as cookie for server-side access if needed
//         document.cookie = `dakjontro_printer_id=${printerId}; path=/; max-age=31536000`; // 1 year
//     }
// };

// export const getPrinterIdFromStorage = (): string | null => {
//     if (typeof window !== 'undefined') {
//         return localStorage.getItem('dakjontro_printer_id');
//     }
//     return null;
// };

// export const removePrinterIdFromStorage = () => {
//     if (typeof window !== 'undefined') {
//         localStorage.removeItem('dakjontro_printer_id');
//         document.cookie = 'dakjontro_printer_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
//     }
// };

export default WeightMachineContext;
