import { SidebarItem } from "@/src/components/Sidebar/SidebarResponsive/sidebar";
import { getLocalTimeZone, ZonedDateTime } from "@internationalized/date";
import { SVGProps } from "react";



export interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export enum UserDevice {
    MOBILE = "MOBILE",
    TABLET = "TABLET",
    DESKTOP = "DESKTOP",
}

export enum PanelSlug {
    EKDAK = "EKDAK",
    BOOKING = "BOOKING",
    DMS = "DMS",
    RMS = "RMS",
    BRTA = "BRTA",
    CORPORATE = "CORPORATE",
    EMTS = "EMTS",
    DAKBAZAR = "DAKBAZAR",
    PICKUP = "PICKUP",
    FLEET = "FLEET",
}

export interface DateTimeRangeOption {
    name: string;
    value: string;
    key: string;
}

export interface StatusOption {
    name: string;
    value: string;
    key: string;
}

export interface GroupOption {
    name: string;
    value: string;
    key: string;
}

export interface Branch {
    id: number;
    branch_code: string;
    name: string;
    name_unicode: string;
    root_post_level_2: string;
    root_post_level_1: string;
    dept: number;
    circle: string;
    upzilla: string;
    district: string;
    status: string;
    control_office: string;
    is_open: boolean;
    rms_code: string;
    direct_transport_request: string;
    emts_branch_code: string;
    shift: string;
    city_post: string;
}

export interface SearchBranchQuery {
    branch_query: string;
    page: number;
    per_page: number;
    status?: string;
}


export interface SearchBranchResponse {
    status: string;
    total: number;
    message: string;
    per_page: number;
    page: number;
    data: Branch[];
}
export interface Panel {
    index: number;
    name: string;
    slug: PanelSlug;
    icon: string;
    shown: boolean;
    submenuShown: boolean;
    submenus: Submenu[];
    selectedSubmenu: Submenu | null;
}

export interface Submenu {
    name: string;
    slug: string;
    selected: boolean;
    icon: string;
    allowed_permissions: string[] | [];
}

export interface MenuItem {
    name: string;
    bn_name: string;
    internal_identifier: string;
    href: string;
    icon: string;
    order?: number;
    access_level?: string;
    sub_menus: MenuItem[];
}

export interface NotificationFile {
    id: number;
    file_name: string;
    file_size: string;
    file_type: string;
    file_url: string;
    created_at: ZonedDateTime;
}

// "status": "success", 
// "message": "User notifications fetched successfully.",
// 'notifications': serializer.data,
// 'total_pages': paginator.num_pages,
// 'total': notifications.count(),
// 'current_page': page_obj.number,
// 'has_next': page_obj.has_next(),
// 'has_previous': page_obj.has_previous(),
// "counts" : {
//     "read": read_count,
//     "archived": archived_count,
//     "delivered": delivered_count,
//     "action_complete": action_complete_count
// }
export interface UserNotificationResponse {
    status: string;
    message: string;
    notifications: UserNotification[];
    total_pages: number;
    total: number;
    current_page: number;
    has_next: boolean;
    has_previous: boolean;
    counts: UserNotificationCounts;
}

export interface ServiceMenu {
    service_name: string;
    available_menus: MenuItem[];
}

export interface UserMenuResponse {
    status: string;
    message: string;
    data: ServiceMenu[] | [];
}

export interface UserNotificationCounts {
    read: number;
    archived: number;
    delivered: number;
    action_complete: number;
}




export interface UserNotification {
    id: number;
    user: number;
    sender: string;
    notification_uuid: string;
    channel: string;
    title: string;
    report_type: string;
    message: string;
    created_at: ZonedDateTime;
    delivered_at: ZonedDateTime | null;
    updated_at: ZonedDateTime | null;
    status: string;
    event: string;
    is_delivered: boolean;
    is_important: boolean;
    files: NotificationFile[];
}

export interface UserNotificationState {
    status: string;
    message: string;
    notifications: UserNotification[];
    total_pages: number;
    total: number;
    current_page: number;
    has_next: boolean;
    has_previous: boolean;
    counts: UserNotificationCounts;
}

export interface ChannelNotificationState {
    [key: string]: UserNotification[];
}


export interface IncomingMessage {
    channel: string;
    message: string;
    type: string;
    uuid: string;
    filename?: string;
    url?: string;
}


export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};
// Define the structure for a service with available menus
export interface ServiceMenu {
    service_name: string;
    available_menus: MenuItem[];
}



export interface PrintJobData {
    account_user_uuid?: string;
    account_number?: string;
    weight: number;
    service_name: string;
    vas?: string;
    order_id?: string;
    order_item_id?: string;
    delivery_office_code: string;
    booked_office_code: string;
    insurance?: number;
    booked_date: string;
    booked_time: string;
    barcode: string;
    orig_barcode: string;
    barcode_width: number;
    barcode_height: number;
    barcode_position_left: number;
    barcode_position_top: number;
    cash?: string; // Can also be boolean if converted
    paid: number;
    mashul: number;
    mashul_code?: string;
    merchant_name?: string;
    tracking_number?: string;
    sender_position_left: number;
    sender_position_top: number;
    sender_font_size: number;
    recipient_position_left: number;
    recipient_position_top: number;
    recipient_font_size: number;
    print_width_inch: number;
    print_height_inch: number;
    print_type: string;
    sender_name: string;
    sender_address: string;
    sender_postoffice: string;
    sender_postcode: string;
    sender_policestation: string;
    sender_district: string;
    sender_phone: string;
    recipient_name: string;
    recipient_address: string;
    recipient_postoffice: string;
    recipient_postcode: string;
    recipient_policestation: string;
    recipient_district: string;
    recipient_phone: string;
    additional_service_text?: string;
}

export interface PrintJob {
    printer_id: string;
    job_type: string;
    command: string;
    status: string;
    job_data: PrintJobData;
}

export interface PrintJobRequest {
    token: string;
    job: PrintJob;
}

export interface PrintJobResponse {
    status: string;
    token: string;
    job_id: string;
    message: string;
    detail?: string;
}

export interface VpReceiveResponse {
    status: string;
    status_code: number;
    message: string;
}

export interface VpReceiveRequest {
    token: string;
    barcode: string;
}

export interface VpSendOTPRequest {
    token: string;
    barcode: string;
}

export interface VpPayMoneyRequest {
    otp: string;
    token: string;
    barcode: string;
}


export const truncateString = (str: string, maxLength: number) => {
    if (str.length <= maxLength) {
        return str;
    }

    const visibleChars = 5;
    const prefixLength = Math.floor((maxLength - visibleChars) / 2);
    const suffixLength = maxLength - prefixLength - visibleChars;

    const truncatedString = str.slice(0, prefixLength) + '...' + str.slice(-suffixLength);

    return truncatedString;
};

export const formatNumberToK = (number: number) => {
    if (typeof number !== 'number') {
        throw new Error('Input must be a number');
    }

    if (number < 1000) {
        return (number / 1000).toFixed(2).replace(/^0+/, '') + 'k';
    } else if (number < 1000000) {
        return (number / 1000).toFixed(1) + 'k';
    } else {
        return (number / 1000000).toFixed(1) + 'M';
    }
}



// Convert DateValue to ISO 8601 string format for both start and end dates
export const formatDateToUTC = (date: ZonedDateTime) => {
    return date.toDate().toISOString(); // Converts to UTC time string
};


export const formatDateToReadableUTC = (date: ZonedDateTime): string => {
    const dateObj = date.toDate(); // Converts to a Date object

    const padZero = (value: number): string => value.toString().padStart(2, "0");

    const day = padZero(dateObj.getUTCDate());
    const month = padZero(dateObj.getUTCMonth() + 1); // Months are zero-based
    const year = dateObj.getUTCFullYear();
    const hours = padZero(dateObj.getUTCHours());
    const minutes = padZero(dateObj.getUTCMinutes());
    const seconds = padZero(dateObj.getUTCSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};


export const formatDateToSQLDate = (date: ZonedDateTime): string => {
    const dateObj = date.toDate();
    return dateObj.toISOString().split("T")[0]; // Extracts YYYY-MM-DD
};

export const formatDateToSQLTime = (date: ZonedDateTime): string => {
    const dateObj = date.toDate();

    const padZero = (value: number): string => value.toString().padStart(2, "0");

    const hours = padZero(dateObj.getUTCHours());
    const minutes = padZero(dateObj.getUTCMinutes());
    const seconds = padZero(dateObj.getUTCSeconds());

    return `${hours}:${minutes}:${seconds}`; // Extracts HH:mm:ss
};



// "id": 17120,
// "user_id": "R140020",
// "insurance_id": null,
// "rpo_address": "Regional Passport Office, MEHERPUR",
// "phone": "01733393371",
// "post_code": "4223",
// "rpo_name": "Meherpur",
// "barcode": "DG744370295BD",
// "item_id": "DG744370295BD",
// "total_charge": "21",
// "service_type": "Parcel",
// "vas_type": "GEP",
// "price": "0",
// "insured": "0",
// "booking_status": "Delivered",
// "created_at": "2024-01-23T08:28:27.000000Z",
// "pending_date": "2025-03-10 14:57:56",
// "booking_date": "2025-03-10 14:58:07",
// "delivered_date": "2025-03-12 14:46:04",
// "updated_at": "2025-04-16T13:32:07.000000Z",
// "is_check_today": 0,
// "push_status": 3


export interface PassportBooking {
    id: number;
    user_id: string;
    rpo_name: string;
    phone: string;
    post_code: string;
    barcode: string;
    item_id: string;
    total_charge: string;
    service_type: string; // e.g., "Parcel"
    vas_type: string; // e.g., "GEP"    
    price: string; // e.g., "0"
    insured: string; // e.g., "0"
    booking_status: string; // e.g., "Delivered"
    created_at: ZonedDateTime;
    pending_date?: ZonedDateTime | null; // optional
    booking_date?: ZonedDateTime | null; // optional
    delivered_date?: ZonedDateTime | null; // optional
    updated_at?: ZonedDateTime | null; // optional
    is_check_today?: number; // optional
    push_status?: number; // optional, e.g., 3


}







// types.ts
export interface PaginationResponse<T> {
    data: T[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    status: string;
    message: string;
}

export interface EventTotals {
    Total_CREATED: number;
    Total_AD_PRINTED: number;
    Total_PRINTED: number;
    Total_RECEIPT_PRINTED: number;
    Total_BOOKED: number;
    Total_BAGGED: number;
    Total_REMOVED: number;
    Total_RECEIVED: number;
    Total_FORWARDED: number;
    Total_UNBAGGED: number;
    Total_DELIVERED: number;
    Total_RETURN_CREATED: number;
    Total_RETURN_DELIVERED: number;
}

export interface ArticleEventRow {
    id: number;
    article_id: number;
    event_type: string;
    created_by: string;
    destination_branch: string;
    creation_branch: string;
    barcode: string;
    instruction: string;
    created_at: string;  // formatted string from API
    updated_at: string;
    device: string;
    print_task_uuid: string;
    ad_task_uuid: string;
    receipt_task_uuid: string;
    ad_barcode?: string | null;
    insurance_price?: string;
    service_charge?: number;
    service_type?: string;
    vas_type?: string;
    vat?: number;
}

export interface ArticleEventPaginationResponse {
    success: "success" | "failed";
    message: string;
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
    event_totals: EventTotals;
    data: ArticleEventRow[] | [];
}


export interface VpListPaginationResponse {
    success: "success" | "failed";
    status_code: number;
    message: string;
    current_page: number;
    total_pages: number;
    total_records: number;
    page_size: number;
    previous_page: number | null;
    data: VpListRow[] | [];
}


export interface VpInfoResponse {
    success: "success" | "failed";
    status_code: number;
    message: string;
    data: VpListRow | null;
}


export interface VpGetQueryParams {
    to_date: string; // e.g., "28-05-2025 23:59:59"
    from_date: string; // e.g., "28-05-2025 00:00:00"
    article_event_type: string; // e.g., "BOOKED"
    service_type: string; // e.g., "Parcel"
    received_status: string; // e.g., "Pending"
    search: string; // e.g., "search term"
    paid_status: string; // e.g., "pending" or "paid"
    otp_status: string; // e.g., "pending" or "verified"
    page: number; // e.g., 1
    page_size: number; // e.g., 10
}

export interface VpListRow {
    id: number;
    booking_id: string;
    form_number: string;
    commission: string;
    payable_amount: string;
    total_vp_cost: string;
    otp: string;
    otp_verified_at: string;
    otp_expired_at: string;
    received_status: string;
    received_by_name: string;
    received_at: string;
    paid_status: string;
    otp_status: string;
    paid_by_name: string;
    paid_at: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    article_barcode: string;
    article_service_type: string;
    article_service_type_name: string;
    article_event_type: string;
    booked_branch_code: string;
    booked_branch_name: string;
    booked_branch_bn_name: string;
    delivery_branch_code: string;
    delivery_branch_name: string;
    delivery_branch_bn_name: string;
    sender_name: string;
    sender_phone: string;

}

export interface CorporateAccountingResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    status: string;
    message: string;
}

export interface AccountingData {
    id: number;
    user_id: string;
    added_by: string;
    account: string;
    from_account: string;
    credit: string;
    debit: string;
    reference: string | null;
    is_auto_verified: number;
    corporate_order_id: string;
    status_active: number;
    approval_status: number;
    approved_at: string | null;
    created_at: string; // or Date
    updated_at: string; // or Date
}

export interface BrtaBooking {
    id: number;
    user_id: string;
    u_id: number;
    insurance_id: string;
    drivingLicenseNo: string;
    brtaReferenceNo: string;
    name: string;
    fatherName: string;
    mobileNo: string;
    houseOrVillage: string;
    road: string;
    postCode: string;
    thana: string;
    district: string;
    division: string;
    postal_code: string;
    barcode: string;
    item_id: string;
    total_charge: string;
    service_type: string; // e.g., "Letter"
    vas_type: string; // e.g., "Registry"
    price: string; // e.g., "0"
    insured: string; // e.g., "0"
    booking_status: string; // e.g., "Delivered"
    bag_id?: number | null; // optional
    bag_status?: number; // optional
    bag_create_at?: ZonedDateTime | null; // optional
    brta_status?: string; // optional
    dls_status?: number; // optional
    return_brta_status?: number; // optional
    return_dls_status?: number; // optional
    created_at: ZonedDateTime;
    pending_date?: ZonedDateTime | null; // optional
    booking_date?: ZonedDateTime | null; // optional
    delivery_check_date?: ZonedDateTime | null; // optional
    delivery_check_method?: string | null; // optional
    updated_at?: ZonedDateTime | null; // optional
    is_check_today?: number; // optional
    is_brta_check_today?: number; // optional
    is_dls_check_today?: number; // optional
    is_scane?: number; // optional
    is_print?: number; // optional
    response_time?: ZonedDateTime | null; // optional
}


// Duplicate interface removed to resolve type conflict. Use the main PassportBooking interface above with ZonedDateTime for created_at.
export interface EmergencyDelivered {
    id: number;
    operator_id: number;
    user_id: number;
    file_id: number;
    name: string;
    driving_license_no: string;
    brta_reference_no: string;
    father_name: string;
    mobile_no: string;
    house_village: string;
    road: string;
    post_code: string;
    thana: string;
    district: string;
    division: string;
    total_charge: string | null;
    service_type: string | null;
    vas_type: string | null;
    price: string | null;
    insured: string | null;
    box_no: string;
    status: number;
    dls_status: number;
    bsp_status: number;
    operation_type: number;
    delivery_status: string | null;
    barcode: string | null;
    booking_date: string | null; // or ZonedDateTime if using temporal handling
    delivery_date: string | null; // or ZonedDateTime if using temporal handling
    created_at: string; // or ZonedDateTime
    updated_at: string; // or ZonedDateTime
}

export interface EmergencyDelivery {
    id: number;
    name: string;
    driving_license_no: string;
    brta_reference_no: string;
    mobile_no: string;
    post_code: string;
    status: number;
    created_at: string;
    [key: string]: any;
}

export interface CorporateBooking {
    id: number;
    user_id: string;
    added_by: string;
    account: string;
    from_account: string;
    credit: string;
    debit: string;
    reference: string | null;
    is_auto_verified: number;
    corporate_order_id: string;
    status_active: number;
    approval_status: number;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface corpotateBookingRequestParams {
    from_date: string;
    to_date: string;
    from_time: string;
    to_time: string;
    page: number;
    per_page: number;
    status?: string;
    search?: string; // e.g., "1" for active bookings
}

export interface BrtaBookingReportRequestParams {
    from_date: string; // e.g., "27-01-2024 00:00:00"
    to_date: string;   // e.g., "28-01-2024 23:59:59"
    postCode: string;  // e.g., "5710"
    status?: string;   // optional, can be "" or any status
    search?: string;   // optional, can be "" or a barcode
    page?: number;     // default 1
    per_page?: number; // default 10
}

export interface PassportBookingReportRequestParams {
    from_date: string; // e.g., "27-10-2024 00:00:00"
    to_date: string;   // e.g., "28-05-2025 23:59:59"
    status: string;    // required (e.g., "Booked", "Delivered")
    page?: number;     // default 1
    per_page?: number; // default 10
    post_code: string; // e.g., "4206"
    search?: string;   // optional
}


export interface EmergencyDeliveryReportRequestParams {
    from_date: string; // e.g., "27-01-2024 00:00:00"
    to_date: string;   // e.g., "19-05-2025 23:59:59"
    status: string;    // required (e.g., "1")
    page?: number;     // default 1
    per_page?: number; // default 10
    post_code: string; // e.g., "1217"
    search?: string;   // optional
}

export interface CorporateBookingReportRequestParams {
    from_date: string;   // e.g., "19-05-2025 00:00:00"
    to_date: string;     // e.g., "19-05-2025 23:59:59"
    status?: string;      // required (e.g., "1")
    print_status?: string; // optional, can be "" or "1"
    page?: string;      // default 1
    per_page?: string;  // default 10
    booked_branch?: string;  // e.g., "1217"
    service_type?: string; // e.g., "Corporate Booking"
    delivery_branch?: string;  // e.g., "1400"
    search?: string;    // optional
    order?: string;
    postCode?: string;

}

export interface CorporateBookingData {
    id: number;
    user_id: number;
    orderid: string;
    tracking_number: string;
    barcode: string;
    merchantCode: string;
    merchantName: string;
    merOrderRef: string;
    packagePrice: string;
    productSizeWeight: string;
    deliveryOption: string;
    CashAmt: string;
    weight: string;
    total_cost: string;
    machine_length: string;
    machine_height: string;
    machine_width: string;
    printer_id: string;
    booking_mode: number;
    special_instruction: string;
    customerDistrict: string;
    customerDistrict_name: string;
    customerThana: string;
    customerThana_name: string;
    custphone: string;
    custaddress: string;
    PostOfficeName: string;
    PostCode: string;
    custname: string;
    orderType: string;
    Shtl: string;
    Cash: string;
    Ret: string;
    partial: string;
    booking_date: string;
    status: number;
    print_status: number;
    bili_status: number;
    created_at: string;
    updated_at: string;
    response_time_json: string;
    print_job_id: string;
}


export const initialDateTimeRangeOptions: DateTimeRangeOption[] = [
    {
        name: "Hourly",
        value: "hourly",
        key: "hourly"
    },
    {
        name: "Daily",
        value: "daily",
        key: "daily"
    },
    {
        name: "Weekly",
        value: "weekly",
        key: "weekly"
    },
    {
        name: "Monthly",
        value: "monthly",
        key: "monthly"
    },
    {
        name: "Fortnightly",
        value: "fortnightly",
        key: "fortnightly"
    },
    {
        name: "Yearly",
        value: "yearly",
        key: "yearly"
    }
];


export interface ArticleListRequestParams {
    from_date: string; // e.g., "27-01-2024 00:00:00"
    to_date: string;   // e.g., "28-01-2024 23:59:59"
    barcode?: string;  // e.g., "DP617329389BD"
    event_type?: string;   // DELIVERED
    page?: number;     // default 1
    per_page?: number; // default 10
}

export interface ArticleEventListRequestParams {
    from_date: string; // e.g., "27-01-2024 00:00:00"
    to_date: string;   // e.g., "28-01-2024 23:59:59"
    barcode?: string;  // e.g., "DP617329389BD"
    event_type?: string;   // DELIVERED
    service_type?: string;   // DELIVERED
    page?: number;     // default 1
    page_size?: number; // default 10
}
export interface RmsBagListRequestParams {
    search?: string;
    bag_category?: string;
    bag_status?: string;
    bag_type?: string;
    rms_destination_branch_name?: string;
    destination_branch_name?: string;
    from_date?: string; // e.g., "2024-01-27T00:00:00Z"
    to_date?: string;   // e.g., "2024-01-28T23:59:59Z"
    page?: number;     // default 1
    per_page?: number; // default 10
}


export interface RmsBagListResponse {
    status: string
    message: string
    bags: RmsBag[]
    total: number
    total_pages: number
    current_page: number
    has_next: boolean
    has_previous: boolean
}

export interface RmsBag {
    id: number
    rms_destination_name: string
    current_owner: string
    creator: string
    next_flagged_receiver: any
    created_branch: string
    created_rms_branch: string
    rms_destination_branch: string
    destination_branch: string
    destination_branch_code: string
    closed_on: any
    created_at: string
    updated_at: string
    status: string
    items_count: number
    bag_items: RmsBagItem[]
    bag_id: string
    rms_destination: string
    rms_destination_code: string
    bag_type: string
    bag_category: string
    is_open: number
    ownership_type: string
    current_bag_id: any
    service_type: number
    prev_flagged_receiver: any
}

export interface RmsBagItem {
    id: number
    emts_branch_code: string
    service_type: RmsServiceType
    service_charge: number
    weight: number
    length: number
    barcode: string
    status: string
    width: number
    height: number
    isCharge: string
    isStation: string
    delivery_branch: string
    article_price: string
    insurance_price: string
    is_bulk_mail: string
    city_post_status: string
    is_city_post: string
    vas_type: string
    receiver_address: string
    receiver_plain_address: any
    sender_address: string
    sender_plain_address: any
    article_desc: string
    created_at: string
    updated_at: string
    booking_info: RmsBookingInfo[]
    barcodes: any[]
    additional_services: any[]
    images: any[]
    item_id: string
    service_name: string
}

export interface FetchRmsBagRequest {
    token: string;
    bagId: string;
}

export interface FetchRmsBagResponse {
    status: string;
    message: string;
    data: RmsBag | null;
}

export interface RmsServiceType {
    key: string
    name: string
    label: string
    description: string
}

export interface RmsBookingInfo {
    id: number
    booked_by: string
    booked_branch: string
    service_type: string
    shift: any
    booked_at: string
    updated_at: string
    booked_user_id: any
    status_active: boolean
    is_delete: boolean
    article: number
}

export interface createRmsBagRequest {
    dest_office_code: string
    rms_instruction: string
    bag_type: string,
    bag_category: string
    bag_id?: string
}


export interface CreateRmsBagResponse {
    status: string
    message: string
    bag: RmsBag | null
}

export interface createBagArticleRequest {
    bag_id: string;
    bag_type: string;
    index: number;
    item_id: string;
    rms_instruction: string
}

export interface SimplifiedBagArticleCreateResponse {
    id: number;
    bag_id: string;
    item_id: string;
    service_type: string;
    service_charge: number;
    weight: number;
    delivery_branch: string;
    vas_type: string;
}

export interface BagSearchResponse {
    status: string
    data: SearchBagData
}

export interface SearchBagData {
    id: number
    rms_destination_name: string
    current_owner: string
    creator: string
    next_flagged_receiver: any
    created_branch: string
    created_rms_branch: string
    rms_destination_branch: string
    destination_branch: string
    closed_on: string
    created_at: string
    updated_at: string
    status: string
    items_count: number
    bag_items: SearchBagItem[]
    bag_id: string
    rms_destination: string
    rms_destination_code: string
    bag_type: string
    bag_category: string
    is_open: number
    ownership_type: string
    current_bag_id: any
    service_type: any
    prev_flagged_receiver: any
}

export interface SearchBagItem {
    id: number
    emts_branch_code: string
    service_type: SearchBagServiceType
    service_charge: number
    weight: number
    length: number
    barcode: string
    status: string
    width: number
    height: number
    isCharge: string
    isStation: string
    delivery_branch: string
    article_price: string
    insurance_price: string
    is_bulk_mail: any
    city_post_status: any
    is_city_post: any
    vas_type: string
    receiver_address: any
    receiver_plain_address: string
    sender_address: any
    sender_plain_address: string
    article_desc: string
    created_at: string
    updated_at: string
    booking_info: SearchBagBookingInfo[]
    barcodes: SearchBagBarcode[]
    additional_services: any[]
    images: any[]
    item_id: string
    service_name: string
}

export interface SearchBagServiceType {
    key: string
    name: string
    label: string
    description: string
}

export interface SearchBagBookingInfo {
    id: number
    booked_by: string
    booked_branch: string
    service_type: string
    shift: any
    booked_at: string
    updated_at: string
    booked_user_id: string
    status_active: boolean
    is_delete: boolean
    article: number
}

export interface SearchBagBarcode {
    barcode_id: string
    created_at: string
    updated_at: string
}

export interface LineResponse {
    status: string;
    branch_code: string;
    lines: Line[];
}

export interface Line {
    id: number;
    line_id: string;
    name: string;
    rms_code: string;
    caption: string;
    category: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
}

export interface Article {
    id: number;
    emts_branch_code: string;
    service_type: ArticleServiceType;
    service_charge: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    isCharge: string;
    isStation: string;
    delivery_branch: string;
    article_price: string;
    barcode: string;
    insurance_price: string;
    is_bulk_mail: null | boolean;
    city_post_status: null | string;
    is_city_post: null | boolean;
    vas_type: string;
    receiver_address: null | string;
    receiver_plain_address: string;
    sender_address: null | string;
    sender_plain_address: string;
    article_desc: string;
    created_at: string;
    updated_at: string;
    booking_info: ArticleBookingInfo[];
    barcodes: ArticleBarcode[];
    additional_services: any[];
    images: any[];
    locations: any[];

}

export interface ArticleBookingInfo {
    id: number;
    booked_by: string;
    booked_branch: string;
    service_type: string;
    shift: string;
    booked_at: string;
    updated_at: string;
    booked_user_id: string;
    status_active: boolean;
    is_delete: boolean;
    article: number;
}

export interface ArticleServiceType {
    key: string;
    name: string;
    label: string;
    description: string;
}

export interface ArticleBarcode {
    barcode_id: string;
    created_at: string;
    updated_at: string;
}

export interface ReceiveBagItemRequest {
    token: string;
    bagId: string;
    itemId: string;
}


export interface ReceiveBagRequest {
    token: string;
    bagId: string;
    lineId: string;
    instructions?: string;
    receiveType: '1' | '0';
}

export interface ReceiveBagApiResponse {
    status: string;
    message?: string;
    data?: any;
}
export interface LabelGenerateRequest {
    token: string;
    label: string;
    printer_id: string;
}

export interface LabelGenerateApiResponse {
    status: string;
    message?: string;
    print_response?: any;
}

// Account Ledger Types
export interface AccountOwner {
    admin?: {
        id: number
        username: string
        uuid: string
    }
    user?: {
        id: number
        username: string
        uuid: string
    }
}


export interface Account {
    account_name: string | null
    account_number: string
    account_owner: AccountOwner
    id: number
}


export interface AccountLedgerEntry {
    amount: number
    created_at: string
    entry_type: "credit" | "debit"
    from_account: Account
    from_account_current_balance?: number
    id: number
    bill_id?: number | null;
    bill_status?: string | null;
    is_billed: boolean;
    reference: string
    to_account: Account
    to_account_current_balance?: number
    transaction_type: "credit" | "debit"
    updated_at: string
}
export interface AccountDetailsResponse {
    data: AccountDetailsData
    message: string
    status: string
}

export interface AccountDetailsData {
    account_branch: AccountBranch
    account_personal: AccountPersonal
    user_info: UserInfo
}


export interface AccountBranch {
    admin_id: number
    branch_account_id: number
    branch_account_number: string
    branch_balance: number
    branch_code: string
    branch_id: number
    branch_is_active: boolean
    branch_name: string
    id: number
    org_id: number
    post_office_branch_id: number
    user_id: number
}

export interface AccountPersonal {
    account_number: string
    account_type: string
    balance_type: string
    created_at: string
    currency: string
    current_balance: number
    id: number
    is_active: boolean
    is_locked: boolean
    max_limit: number
    updated_at: string
}

export interface UserInfo {
    email: any
    email_verified: boolean
    id: number
    legal_name: string
    phone: string
    phone_verified: boolean
    username: string
    uuid: string
}

export interface AccountLedgerListResponse {
    data: AccountLedgerEntry[]
    pagination: PaginationInfo
    status: string
}

export interface AccountLedgerListParams {
    page?: number
    per_page?: number
    from_date?: string
    to_date?: string
    entry_type?: string;
    transaction_type?: string;
    from_account?: string
    to_account?: string
}


export interface CorporateUserDataParams {
    page?: number
    per_page?: number
    from_date?: string
    to_date?: string
    from_time?: string
    to_time?: string
    search?: string
}

export interface PaginationInfo {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    per_page: number;
    total: number;
    total_pages: number;
}
