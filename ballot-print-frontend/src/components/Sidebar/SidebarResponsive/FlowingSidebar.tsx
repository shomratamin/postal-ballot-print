"use client"
import { AnimatePresence, motion } from "framer-motion";
import ComponentSidebar from './ComponentSidebar';
import { useSidebarContext } from "@/src/app/context/layout-context";
import { SidebarItem } from "./sidebar";
import { Locale } from "@/dictionaries/dictionaty";

const FlowingSidebar = ({ menus, lang }: { menus: SidebarItem[], lang: Locale }) => {
    const { panels, sidebar, sidebar_floating, toggleSidebar, toggleFloatingSidebar, togglePanelVisibility, toggleSubmenuVisibility } = useSidebarContext();
    const showAnimation = {
        hidden: {
            width: 0,
            opacity: 0,
            transition: {
                duration: 0.2,
            },
        },
        show: {
            opacity: 1,
            width: "auto",
            transition: {
                duration: 0.2,
            },
        },
    };
    const sidebarVariants = {
        open: {
            width: "230px",
            transition: {
                duration: 0.3,
                ease: [0.42, 0, 1, 1],
            },
        },
        closed: {
            width: "0px",
            transition: {
                duration: 0.3,
                ease: [0, 0, 0.58, 1],
            },
        },
    };

    return (
        <>
            {/* Desktop Sidebar - Hidden on md screens and below */}
            <div className="hidden lg:block border-r border-pdfLightHover dark:border-dgenDarkBorder min-h-screen sticky top-0">
                <motion.div
                    variants={sidebarVariants}
                    initial="open"
                    animate="open"
                    className="sidebar overflow-hidden"
                >
                    <section className='flex flex-col gap-1'>
                        <ComponentSidebar menus={menus} lang={lang} />
                    </section>
                </motion.div>
            </div>

            {/* Mobile/Tablet Sidebar - Overlay for md screens and below */}
            <div className={`lg:hidden fixed inset-0 z-50 ${sidebar ? 'block' : 'hidden'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={toggleSidebar}
                />

                {/* Sidebar */}
                <motion.div
                    // variants={sidebarVariants}
                    initial="closed"
                    animate={sidebar ? "open" : "closed"}
                    className="absolute left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-pdfLightHover dark:border-dgenDarkBorder shadow-xl overflow-hidden"
                >
                    <section className='flex flex-col gap-1'>
                        <ComponentSidebar menus={menus} lang={lang} />
                    </section>
                </motion.div>
            </div>
        </>
    );
};

export default FlowingSidebar;