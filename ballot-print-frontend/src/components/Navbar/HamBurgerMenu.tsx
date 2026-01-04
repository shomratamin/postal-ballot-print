"use client"

import { useSidebarContext } from "@/src/app/context/layout-context";



const HamBurgerMenu = () => {
    const { panels, sidebar, sidebar_floating, toggleSidebar, toggleFloatingSidebar, togglePanelVisibility, toggleSubmenuVisibility } = useSidebarContext();

    return (
        <div className="flex items-center" onClick={toggleSidebar} >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
        </div>
    );
};

export default HamBurgerMenu;
