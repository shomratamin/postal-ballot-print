"use client"
import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarItem } from './sidebar';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useSidebarContext } from '@/src/app/context/layout-context';
import { Locale } from '@/dictionaries/dictionaty';

export default function ComponentSidebar({ menus, lang }: { menus: SidebarItem[], lang: Locale }) {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebar, toggleSidebar } = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const isActive = (href?: string) => {
        if (!href) return false;
        return pathname === href || pathname.startsWith(href + '/');
    };

    // Auto-expand all items that have children by default
    useEffect(() => {
        const findAllParentItems = (items: SidebarItem[]): string[] => {
            const parentKeys: string[] = [];

            for (const item of items) {
                if (item.items && item.items.length > 0) {
                    parentKeys.push(item.key);
                    // Recursively find nested parent items
                    const nestedParents = findAllParentItems(item.items);
                    parentKeys.push(...nestedParents);
                }
            }

            return parentKeys;
        };

        const allParentKeys = new Set<string>();
        menus.forEach(menu => {
            if (menu.items) {
                const parentKeys = findAllParentItems(menu.items);
                parentKeys.forEach(key => allParentKeys.add(key));
            }
        });

        // Expand all parent items by default
        setExpandedItems(allParentKeys);
    }, [menus]); // Only depend on menus, not pathname

    const toggleExpanded = (key: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const handleItemClick = (item: SidebarItem) => {
        // If item has children, only toggle expansion (don't navigate)
        toggleSidebar(); // Close sidebar on item click
        if (item.items && item.items.length > 0) {
            toggleExpanded(item.key);
        } else if (item.href) {
            // Only navigate if item has no children
            router.push(item.href);
        }
    };

    const renderMenuItem = (item: SidebarItem, level: number = 0) => {
        const hasChildren = item.items && item.items.length > 0;
        const isExpanded = expandedItems.has(item.key);
        const active = isActive(item.href);

        return (
            <div key={item.key} className="sidebar-item">
                <button
                    className={`sidebar-item-button ${active ? 'active' : ''} ${level > 0 ? 'nested' : ''}`}
                    onClick={() => handleItemClick(item)}
                >
                    <div className="sidebar-item-content">
                        {item.icon && (
                            <Icon
                                icon={item.icon}
                                className="sidebar-item-icon"
                            />
                        )}
                        <span className="sidebar-item-text">
                            {lang == "en" ? item.title : item.bn_title}
                        </span>
                    </div>

                    {hasChildren && (
                        <Icon
                            icon="solar:alt-arrow-down-line-duotone"
                            className={`sidebar-expand-icon ${isExpanded ? 'expanded' : ''}`}
                        />
                    )}
                </button>

                {/* Render nested items */}
                {hasChildren && (
                    <div className={`sidebar-nested-items ${isExpanded ? 'expanded' : 'collapsed'}`}>
                        <div className="sidebar-nested-container">
                            {item.items!.map(subItem => renderMenuItem(subItem, level + 1))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSection = (menu: SidebarItem) => {
        if (!menu.items || menu.items.length === 0) {
            return renderMenuItem(menu);
        }

        return (
            <div key={menu.key} className="sidebar-section">
                <div className="sidebar-section-header">
                    <h3 className="sidebar-section-title">
                        {lang == "en" ? menu.title : menu.bn_title}
                    </h3>
                </div>

                <div className="sidebar-items">
                    {menu.items.map(item => renderMenuItem(item))}
                </div>
            </div>
        );
    };

    // Render the sidebar content
    return (
        <>
            <nav className="sidebar-nav">
                {menus.map(menu => renderSection(menu))}
            </nav>
        </>
    );
}
