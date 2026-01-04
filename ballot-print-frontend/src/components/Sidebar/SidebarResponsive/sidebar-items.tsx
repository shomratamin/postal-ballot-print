import { Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

import { SidebarItem, SidebarItemType } from "./sidebar";
import TeamAvatar from "./team-avatar";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

export const sectionItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Overview",
    bn_title: "সংক্ষিপ্ত বিবরণ",
    items: [
      {
        key: "home",
        href: "#",
        icon: "solar:home-2-linear",
        title: "Home",
        bn_title: "হোম",
      },
      {
        key: "projects",
        href: "#",
        icon: "solar:widget-2-outline",
        title: "Projects",
        bn_title: "প্রকল্প",
        endContent: (
          <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
      },
      {
        key: "tasks",
        href: "#",
        icon: "solar:checklist-minimalistic-outline",
        title: "Tasks",
        bn_title: "কাজ",
        endContent: (
          <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
      },
      {
        key: "team",
        href: "#",
        icon: "solar:users-group-two-rounded-outline",
        title: "Team",
        bn_title: "দল",
      },
      {
        key: "tracker",
        href: "#",
        icon: "solar:sort-by-time-linear",
        title: "Tracker",
        bn_title: "ট্র্যাকার",
        endContent: (
          <Chip size="sm" variant="flat">
            New
          </Chip>
        ),
      },
    ],
  },
  {
    key: "organization",
    title: "Organization",
    bn_title: "সংস্থা",
    items: [
      {
        key: "cap_table",
        href: "#",
        title: "Cap Table",
        bn_title: "ক্যাপ টেবিল",
        icon: "solar:pie-chart-2-outline",
        items: [
          {
            key: "shareholders",
            href: "#",
            title: "Shareholders",
            bn_title: "শেয়ারহোল্ডার",
          },
          {
            key: "note_holders",
            href: "#",
            title: "Note Holders",
            bn_title: "নোট হোল্ডার",
          },
          {
            key: "transactions_log",
            href: "#",
            title: "Transactions Log",
            bn_title: "লেনদেনের লগ",
          },
        ],
      },
      {
        key: "analytics",
        href: "#",
        icon: "solar:chart-outline",
        title: "Analytics",
        bn_title: "বিশ্লেষণ",
      },
      {
        key: "perks",
        href: "/perks",
        icon: "solar:gift-linear",
        title: "Perks",
        bn_title: "সুবিধা",
        endContent: (
          <Chip size="sm" variant="flat">
            3
          </Chip>
        ),
      },
      {
        key: "expenses",
        href: "#",
        icon: "solar:bill-list-outline",
        title: "Expenses",
        bn_title: "খরচ",
      },
      {
        key: "settings",
        href: "/settings",
        icon: "solar:settings-outline",
        title: "Settings",
        bn_title: "সেটিংস",
      },
    ],
  },
];

export const sectionItemsWithTeams: SidebarItem[] = [
  ...sectionItems,
  {
    key: "your-teams",
    title: "Your Teams",
    bn_title: "আপনার দল",
    items: [
      {
        key: "heroui",
        href: "#",
        title: "HeroUI",
        bn_title: "হিরো ইউআই",
        startContent: <TeamAvatar name="Hero UI" />,
      },
      {
        key: "tailwind-variants",
        href: "#",
        title: "Tailwind Variants",
        bn_title: "টেইলউইন্ড ভেরিয়েন্ট",
        startContent: <TeamAvatar name="Tailwind Variants" />,
      },
      {
        key: "heroui-pro",
        href: "#",
        title: "HeroUI Pro",
        bn_title: "হিরো ইউআই প্রো",
        startContent: <TeamAvatar name="HeroUI Pro" />,
      },
    ],
  },
];

