"use client"
import React, { useEffect, useState } from 'react'
import { Avatar, Button, Spacer, Spinner, useDisclosure } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
// import { formatNumberToK, Panel, PanelSlug, truncateString } from '@/lib/store/common/type';
import { useSidebarContext } from '@/src/app/context/layout-context';

import { redirect, usePathname, useRouter } from 'next/navigation'
import SidebarDrawer from './sidebar-drawer';
import Sidebar, { SidebarItem } from './sidebar';
import { sectionItemsWithTeams } from './sidebar-items';
import { Icon } from '@iconify/react/dist/iconify.js';
// import { Player } from '@lottiefiles/react-lottie-player';
import Cookies from "js-cookie";




export default function ComponentSidebarNext({ menus }: { menus: SidebarItem[] }) {
    const pathname = usePathname();
    const { panels, sidebar, sidebar_floating, toggleSubmenuSelection, toggleSidebar, toggleFloatingSidebar, togglePanelVisibility, toggleSubmenuVisibility } = useSidebarContext();

    const { isOpen, onOpen, onOpenChange } = useDisclosure();



    useEffect(() => {
        console.log("menus", JSON.stringify(menus))
        if (sidebar) {
            onOpen();
        }
    }, [sidebar]);




    const handleOnOpenChange = () => {
        onOpenChange();
        toggleSidebar()
    }

    const handleLogout = () => {
        Cookies.remove('access');
        Cookies.remove('refresh');
        window.location.href = '/'
    };


    return (
        <SidebarDrawer
            className="!border-r-small border-divider"
            classNames={{
                body: "overflow-x-hidden",
                closeButton: "border border-1 rounded-md",
            }}
            isOpen={isOpen}
            onOpenChange={handleOnOpenChange}
        >
            <div className="relative flex h-full w-72 flex-1 flex-col p-6">
                <div className='mb-3 w-full flex justify-center items-center'>
                    {/* <Player
                        autoplay
                        loop
                        speed={12}
                        src="/library/animations/postman-running.json"
                        style={{ height: '80px', width: '80px' }}
                        className="dark:hidden"
                    />
                    <Player
                        autoplay
                        loop
                        speed={12}
                        src="/library/animations/postman-running-dark.json"
                        style={{ height: '80px', width: '80px' }}
                        className="hidden dark:block"
                    /> */}
                </div>
                <h3 className="mb-3 text-center text-lg font-bold text-black dark:text-white sm:text-lg">
                    ডাক অধিদপ্তর
                </h3>
                <Sidebar defaultSelectedKey="home" items={menus} />

                <div className="mt-auto flex flex-col">

                    <Button
                        className="justify-start text-default-500 data-[hover=true]:text-foreground"
                        startContent={
                            <Icon
                                className="rotate-180 text-default-500"
                                icon="solar:minus-circle-line-duotone"
                                width={24}
                            />
                        }
                        variant="light"
                        onPress={handleLogout}
                    >
                        Log Out
                    </Button>
                </div>
            </div>
        </SidebarDrawer>
    )
}
