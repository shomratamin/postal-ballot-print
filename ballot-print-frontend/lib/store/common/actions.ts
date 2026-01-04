"use server"

import { SidebarItem } from "@/src/components/Sidebar/SidebarResponsive/sidebar";


interface Identifiable {
    id: string | number;
}

/**
 * Converts an array of objects with 'id' properties into a map indexed by these IDs.
 * @param array Array of objects that must have an 'id' property.
 * @returns An object map where keys are the 'id' of the objects.
 */

export async function arrayToObjectMap<T extends Identifiable>(array: T[]): Promise<Record<string, T>> {
    return array.reduce((acc: Record<string, T>, item: T) => {
        acc[item.id.toString()] = item;
        return acc;
    }, {});
}


export const get_menus = async (): Promise<SidebarItem[]> => {
    // Hardcoded ballot print menu data - not fetching from API
    const sidebarItems: SidebarItem[] = [
        {
            key: "ballot-print",
            title: "Ballot Print",
            bn_title: "ব্যালট প্রিন্ট",
            items: [
                {
                    key: "dashboard",
                    title: "admin Dashboard",
                    bn_title: "এডমিন ড্যাশবোর্ড",
                    href: "/dashboard",
                    icon: "solar:widget-2-line-duotone",
                    order: 1,
                    items: []
                },
                {
                    key: "ballot-print",
                    title: "Ballot Print",
                    bn_title: "ব্যালট প্রিন্ট",
                    href: "/ballot_print",
                    icon: "solar:printer-line-duotone",
                    order: 2,
                    items: [
                        {
                            key: "envelope",
                            title: "Envelope",
                            bn_title: "এনভেলপ",
                            href: "/ballot_print/envelope",
                            icon: "solar:letter-line-duotone",
                            items: []
                        },
                        {
                            key: "batch-list",
                            title: "Batch List",
                            bn_title: "ব্যাচ তালিকা",
                            href: "/ballot_print/batch_list",
                            icon: "solar:list-line-duotone",
                            items: []
                        },
                        {
                            key: "printed-list",
                            title: "Printed List",
                            bn_title: "মুদ্রিত তালিকা",
                            href: "/ballot_print/printed_list",
                            icon: "solar:checklist-line-duotone",
                            items: []
                        },
                        {
                            key: "ballot-reprint",
                            title: "Ballot RePrint",
                            bn_title: "ব্যালট পুনঃমুদ্রণ",
                            href: "/ballot_print/ballot_reprint",
                            icon: "solar:printer-minimalistic-line-duotone",
                            items: []
                        }
                    ]
                }
            ]
        }
    ];

    console.log("Returning hardcoded ballot print menu");
    return sidebarItems;
};