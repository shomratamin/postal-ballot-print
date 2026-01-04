"use server"

import { SidebarItem } from "@/src/components/Sidebar/SidebarResponsive/sidebar";
import { MenuItem, ServiceMenu } from "./types";
import fetchPermissionMenu from "@/lib/http/user/fetchPermissionMenu";


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
    // Fetching menu data from API
    const menuData = await fetchPermissionMenu();
    console.log("Fetched Menu Data:", menuData);

    // Filter to only include DMS service
    // const dmsServices = menuData.data;
    const dmsServices = menuData.data.filter((service: ServiceMenu) => service.service_name.toLowerCase() === "ballot print");

    const sidebarItems: SidebarItem[] = dmsServices.map((service: ServiceMenu) => {
        const sortedMenus = service.available_menus
            .slice() // make a shallow copy to avoid mutating original
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));  // sort by 'order'
        let x: SidebarItem = {
            key: service.service_name.toLowerCase().replace(/\s+/g, "-"),
            title: service.service_name,
            bn_title: service.service_name, // Assuming bn_title is same as title for now
            items: [],
        };
        if (sortedMenus.length > 0) {
            x.items = sortedMenus.map((menu: MenuItem) => {
                let _item: SidebarItem = {
                    key: menu.internal_identifier,
                    title: menu.name,
                    bn_title: menu.bn_name,
                    href: menu.href,
                    icon: menu.icon,
                    order: menu.order,
                    access_level: menu.access_level,
                    items: []
                }
                if (menu.sub_menus && menu.sub_menus.length > 0) {
                    _item.items = menu.sub_menus.map((submenu: MenuItem) => ({
                        key: submenu.internal_identifier,
                        title: submenu.name,
                        bn_title: submenu.bn_name,
                        href: submenu.href || "#",
                        icon: submenu.icon || "solar:menu-dots-line-duotone",
                    }));
                }
                return _item
            });

        }

        return x;
    });

    return sidebarItems;
};