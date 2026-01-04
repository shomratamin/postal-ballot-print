"use client"



import { initialPanels } from '@/lib/store/common/store';
import { Panel, Submenu, PanelSlug } from '@/lib/store/common/types';
import { createContext, useContext } from 'react';


export interface SidebarContext {
   panels: Panel[];
   selectedPanel: Panel;
   selectedSubmenu: Submenu | null;
   sidebar: boolean;
   sidebar_floating: boolean;
   toggleSidebar: () => void;
   screen_size: number;
   setScreenSize: (x: number) => void;
   toggleFloatingSidebar: () => void;
   togglePanelVisibility: (slug: PanelSlug) => void;
   toggleSubmenuVisibility: (slug: PanelSlug) => void;
   toggleSubmenuSelection: (slug: PanelSlug, submenuSlug: string) => void;
   addPanel: (panel: Panel) => void;
   removePanel: (slug: PanelSlug) => void;
}


export const SidebarContext = createContext<SidebarContext>({
   panels: initialPanels,
   selectedPanel: initialPanels[0],
   selectedSubmenu: null,
   sidebar: false,
   sidebar_floating: false,
   screen_size: 350,
   setScreenSize: (x) => { },
   toggleSidebar: () => { },
   toggleSubmenuSelection: (slug: PanelSlug, submenuSlug: string) => { },
   toggleFloatingSidebar: () => { },
   togglePanelVisibility: (slug: PanelSlug) => { },
   addPanel: (panel: Panel) => { },
   removePanel: (slug: PanelSlug) => { },
   toggleSubmenuVisibility: (slug: PanelSlug) => { },
});

export const useSidebarContext = () => {
   return useContext(SidebarContext);
};

