"use client"
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react'
import Image from "next/image";
import Link from "next/link";
import ComponentSidebar from './ComponentSidebar';
import { useSidebarContext } from '@/src/app/context/layout-context';
import { menu } from '@heroui/react';
import { SidebarItem } from './sidebar';
import { Locale } from '@/dictionaries/dictionaty';

export default function FloatingSidebar({ menus, lang }: { menus: SidebarItem[], lang: Locale }) {
    const { panels, sidebar, sidebar_floating, toggleSidebar, toggleFloatingSidebar, togglePanelVisibility, toggleSubmenuVisibility } = useSidebarContext();


    const sidebarFloating = {
        open: {
            left: "0px",
            transition: {
                duration: 0.1,
                ease: [0.42, 0, 1, 1],
            },
        },
        closed: {
            left: "-390px",
            transition: {
                duration: 0.1,
                ease: [0, 0, 0.58, 1],
            },
        },
    };


    const truncateString = (str: string, maxLength: number) => {
        if (str.length <= maxLength) {
            return str;
        }

        const visibleChars = 5;
        const prefixLength = Math.floor((maxLength - visibleChars) / 2);
        const suffixLength = maxLength - prefixLength - visibleChars;

        const truncatedString = str.slice(0, prefixLength) + '...' + str.slice(-suffixLength);

        return truncatedString;
    };



    const handleSidebarOpen = () => {
        console.log("toogle sidebar")

    }


    return (
        <motion.div
            // variants={sidebarFloating}
            initial={"closed"}
            // initial={sidebar ? "open" : "closed"}
            // animate={sidebar ? "open" : "closed"}
            className='bg-white dark:bg-dgenDark border-r border-dgenLightHover dark:border-dgenDarkBorder h-[100vh] overflow-hidden fixed z-50 left-0 top-0'
        >
            <section className="flex flex-col gap-1 overflow-hidden">
                <div className="flex justify-between items-center border-b border-dgenLightHover dark:border-dgenDarkBorder">
                    <div className="flex items-center">
                        <div className="ml-4 cursor-pointer" onClick={handleSidebarOpen}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                            </svg>
                        </div>

                        <Link
                            href="/"
                            className={`header-logo block w-[68%] p-2 py-3`}
                        >
                            <Image
                                src="/static/images/logo/logo-2.svg"
                                alt="logo"
                                width={50}
                                height={20}
                                className="w-full dark:hidden"
                            />
                            <Image
                                src="/static/images/logo/logo.svg"
                                alt="logo"
                                width={50}
                                height={20}
                                className="hidden w-full dark:block"
                            />
                        </Link>
                    </div>
                    <div className="mr-2 cursor-pointer" onClick={handleSidebarOpen}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>


                    </div>
                </div>
                <ComponentSidebar menus={menus} lang={lang} />


            </section>
        </motion.div>

    )
}
