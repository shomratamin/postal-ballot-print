import { Branch, DateTimeRangeOption, Panel, PanelSlug, StatusOption, UserNotificationState, VpListRow } from "./types";


export const initialbranch: Branch = {
    branch_code: "",
    name: "",
    circle: "",
    upzilla: "",
    district: "",
    city_post: "",
    control_office: "",
    dept: 0,
    direct_transport_request: "",
    emts_branch_code: "",
    id: 0,
    is_open: false,
    name_unicode: "",
    rms_code: "",
    status: "",
    root_post_level_1: "",
    root_post_level_2: "",
    shift: "",
}

export const initialPanels: Panel[] = [
    {
        index: 0,
        name: "DMS",
        slug: PanelSlug["DMS"],
        icon: '/static/images/sidebar/list-check.svg',
        shown: true,
        submenuShown: true,
        selectedSubmenu: {
            name: "Dashboard",
            slug: "dashboard",
            allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
            selected: false,
            icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
        },
        submenus: [
            {
                name: "Dashboard",
                slug: "dashboard",
                selected: true,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            },
            {
                name: "Bags",
                slug: "bags",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
        ]
    },
    {
        index: 34,
        name: "RMS",
        slug: PanelSlug["RMS"],
        icon: '/static/images/sidebar/list-check.svg',
        shown: true,
        submenuShown: true,
        selectedSubmenu: {
            name: "Dashboard",
            slug: "dashboard",
            selected: false,
            allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
            icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
        },
        submenus: [
            {
                name: "Dashboard",
                slug: "dashboard",
                selected: true,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            },
            {
                name: "Bags",
                slug: "bags",
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.post-master.full-permit", "ekdak.super-admin.full-permit"],
                selected: false,
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
        ]
    },
    {
        index: 1,
        name: "BRTA",
        slug: PanelSlug["BRTA"],
        icon: '/static/images/sidebar/list-check.svg',
        shown: true,
        submenuShown: false,
        selectedSubmenu: null,
        submenus: [
            {
                name: "Dashboard",
                slug: "dashboard",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "brta.brta-master-developer.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            },
            {
                name: "Bookings",
                slug: "bookings",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "brta.brta-master-developer.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
        ]
    },
    {
        index: 2,
        name: "Ekdak",
        slug: PanelSlug["EKDAK"],
        icon: '/static/images/sidebar/folder-upload.svg',
        shown: true,
        submenuShown: true,
        selectedSubmenu: null,
        submenus: [
            {
                name: "Dashboard",
                slug: "dashboard",
                selected: true,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            },
            {
                name: "SMS",
                slug: "sms",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            },
            {
                name: "Users",
                slug: "users",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
            {
                name: "Notification",
                slug: "notification",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit"],
                icon: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
            },
        ]
    },


    {
        index: 3,
        name: "EMTS",
        slug: PanelSlug["EMTS"],
        icon: '/static/images/sidebar/messages.svg',
        shown: false,
        submenuShown: false,
        selectedSubmenu: null,
        submenus: [
            // {
            //     name: "Dashboard",
            //     slug: "dashboard",
            //     selected: false,
            //     icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            // },
            {
                name: "Users",
                slug: "users",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit", "emts.emts-super-admin.full-permit"],
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
        ]
    },
    {
        index: 4,
        name: "Dakbazar",
        slug: PanelSlug["DAKBAZAR"],
        icon: '/static/images/sidebar/list-check.svg',
        shown: false,
        submenuShown: false,
        selectedSubmenu: null,
        submenus: [
            // {
            //     name: "Dashboard",
            //     slug: "dashboard",
            //     selected: false,
            //     icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            // },
            {
                name: "Users",
                slug: "users",
                selected: false,
                allowed_permissions: ["ekdak.dpmg.full-permit", "ekdak.super-admin.full-permit", "dakbazar.dakbazar-super-admin.full-permit"],
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            },
        ]
    },
    // {
    //     index: 5,
    //     name: "Fleet",
    //     slug: PanelSlug["FLEET"],
    //     icon: '/static/images/sidebar/list-check.svg',
    //     shown: false,
    //     submenuShown: false,
    //     selectedSubmenu: null,
    //     submenus: [
    //         // {
    //         //     name: "Dashboard",
    //         //     slug: "dashboard",
    //         //     selected: false,
    //         //     icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
    //         // },
    //         {
    //             name: "Users",
    //             slug: "users",
    //             selected: false,
    //             icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    //         },
    //     ]
    // },

]



export const initialDateTimeRangeOptionsBn = [
    { key: "hourly", nameKey: "hourly" },
    { key: "daily", nameKey: "daily" },
    { key: "weekly", nameKey: "weekly" },
    { key: "fortnightly", nameKey: "fortnightly" },
    { key: "monthly", nameKey: "monthly" },
    { key: "yearly", nameKey: "yearly" },
];



export const initialVpListRow: VpListRow = {
    id: 0,
    booking_id: '',
    form_number: '',
    commission: '',
    payable_amount: '',
    total_vp_cost: '',
    otp: '',
    otp_verified_at: '',
    otp_expired_at: '',
    received_status: '',
    received_by_name: '',
    received_at: '',
    paid_status: '',
    otp_status: '',
    paid_by_name: '',
    paid_at: '',
    created_by_name: '',
    created_at: '',
    updated_at: '',
    article_barcode: '',
    article_service_type: '',
    article_service_type_name: '',
    article_event_type: '',
    booked_branch_bn_name: '',
    booked_branch_name: '',
    booked_branch_code: '',
    delivery_branch_bn_name: '',
    delivery_branch_code: '',
    delivery_branch_name: '',
    sender_name: '',
    sender_phone: ''

};
