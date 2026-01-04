import { Person } from "../person/types";

export interface Post {
  id: number;
  order_id?: number;
  step: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  created_by: number;
  description: string;
  service_id: number;
  service_item_id: number;
  service_cost: number;
  service_name: string;
  service_bn_name: string;
  additional_service_cost: number;
  total_cost: number;
  zone: string;
  country: string;
  zone_id: number;
  country_id: number;
  weight_upper: number;
  weight_lower: number;
  barcode: string;
  status: PostStatus;
  type: PostType;
  sender: Person;
  recipient: Person;
  additional_service_items: AdditionalServiceItem[];
  created_at: string;
  updated_at: string;
  vp_amount?: number;
  vp_form_number?: string;
  events?: PostEvent[];
}

export enum PostStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  PAID = "PAID",
  HOLD = "HOLD",
  ONGOING = "ONGOING",
  DELIVERED = "DELIVERED",
}
export enum PostType {
  DOMESTIC = "DOMESTIC",
  INTERNATIONAL = "INTERNATIONAL"
}


export interface PostStoreRequest {
  step: string;
  weight: number;
  type: PostType;
  service_id: number;
  service_cost: number;
  additional_service_cost: number;
  total_cost: number;
  weight_upper: number;
  weight_lower: number;
  description: string;
  service_name: string;
  service_item_id: number;
  service_bn_name: string;
  zone: string;
  zone_id: number;
  country: string;
  country_id: number
}

export interface PostUpdateRequest {
  id: number;
  step: string;
  weight: number;
  type: PostType;
  service_id: number;
  service_cost: number;
  total_cost: number;
  additional_service_cost: number;
  weight_upper: number;
  weight_lower: number;
  description: string;
  service_name: string;
  service_item_id: number;
  service_bn_name: string;
  zone: string;
  zone_id: number;
  country: string;
  country_id: number
}

export interface PostStoreResponse {
  id: number;
  type: PostType;
  step: string;
  created_by: number;
  weight: number;
  service_name: string;
  service_bn_name: string;
  service_id: number;
  service_item_id: number;
  zone: string;
  country: string;
  zone_id: number;
  country_id: number;
  service_cost: number;
  additional_service_cost: number;
  total_cost: number;
  sender: Person | null;
  recipient: Person | null;
  additional_services: any;
  weight_upper: number;
  weight_lower: number;
  status_active: number;
  is_delete: number;
  description: string;
  barcode: string;
  created_at: string;
  updated_at: string;
  additional_service_items: AdditionalServiceItem[]
}

export interface BarCodeRequest {
  post_id: number;
  barcode_type: string
}
export interface BarCodeResponse {
  message: string;
  data: string
}

export interface BarCodeResponseWrapper {
  status: string;
  message: string;
  data: BarCodeResponse | null
}


export interface PostStoreResponseWrapper {
  status: string;
  message: string;
  data: Post | null
}

export interface FetchPostResponseWrapper {
  status: string;
  message: string;
  data: Post | null
}

export interface FetchPostDMSResponseWrapper {
  status: string;
  status_code?: number;
  message: string;
  data: Post | null
}


export interface PostEvent {
  id: number;
  event_type: string;
  instruction: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  destination_branch: number | null;
  creation_branch: number | null;
  received_branch: number | null;
  location: string | null;
  device: number | null;
  print_task_uuid: string | null;
  ad_task_uuid: string | null;
  receipt_task_uuid: string | null;
}


export interface AdditionalServiceItemStoreRequest {
  id?: number;
  post_id: number;
  additional_service_id: number;
  cost: number;
  value: string;
  selectable: number;
  selected: number;
}

export interface AdditionalServiceItemStoreResponse {
  id: number;
  post_id: number;
  additional_service_id: number;
  cost: number;
  value: number;
  selectable: number;
  selected: number;
  created_at: string;
  updated_at: string;
}

export interface AdditionalServiceItem {
  id: number;
  post_id: number;
  additional_service_id: number;
  status_active: number;
  is_delete: number;
  cost: string;
  value: string;
  created_at: string;
  updated_at: string;
  name: string;
  form_number?: string;
  selected: boolean;
  selectable: boolean;
}















export interface DmsAddress {
  user_uuid?: string;
  username: string;
  title?: string;
  phone_number: string;
  country: string;
  zone: string;
  division: string;
  division_id: number;
  district: string;
  district_id: number;
  police_station: string;
  police_station_id: number;
  post_office: string;
  post_office_id: number;
  street_address: string;
  address_type: string;
}

export interface DmsCreateArticleRequest {
  // core
  is_international: boolean;
  country_name?: string; // required when is_international === true
  service_name: string;
  delivery_branch: string;

  // routing / flags
  city_post_status?: string;
  is_city_post?: string;
  emts_branch_code?: string;
  hnddevice: string;
  barcode: string;

  // charges / station
  isCharge?: string;
  isStation?: string;

  // value-added service
  vas_type: string;

  // AD / POD
  set_ad: string;
  ad_pod_id?: string;

  // VP (value payable)
  vp_service?: string;
  vp_amount?: string;
  form_number?: string;

  // insurance (except book packet, speed post)
  insurance_price?: string;

  // bulk mail (only letter & document)
  is_bulk_mail?: string;

  // images
  image_src?: string;
  image_pod?: string; // base64 data URL

  // parcel specs
  weight: number; // grams
  length?: number; // cm
  width?: number;  // cm
  height?: number; // cm

  // article info
  article_price?: number; // in CNY (per example)
  article_desc?: string;

  postal_service?: string;
  blind_literature?: string;

  // parties
  receiver: DmsAddress;
  sender: DmsAddress;
  printer_id: string;
}


export type DmsCreateArticleApiResponse = {
  status: string;
  status_code: number;             // e.g., 201
  article_id: number;              // e.g., 302
  article_uuid: string;              // e.g., 302
  barcode: string;                 // e.g., "DP617329389BD"
  ad_barcode: string;                 // e.g., "DP617329389BD"
  total_charge: string;            // e.g., "68.0 tk"
  message: string;                 // success message
}



export type DmsBookArticleApiResponse = {
  status: string;
  status_code: number;             // e.g., 200
  message: string;                 // success message
  data: ArticleDetailsData | null;
}


export interface ArticleDetailsData {
  id: number;
  emts_branch_code: string;
  service_type: ArticleServiceType;
  service_charge: number;
  weight: number;
  length: number;
  barcode: string;
  status: string; // e.g., "AD_PRINTED"
  width: number;
  height: number;
  total_charge: number;
  isCharge: "Yes" | "No";
  isStation: "Yes" | "No";
  delivery_branch: string;
  article_price: string; // comes as string "0.0"
  insurance_price: string; // comes as string "100.0"
  is_bulk_mail: "Yes" | "No";
  city_post_status: "Yes" | "No";
  is_city_post: "Yes" | "No";
  vas_type: string; // e.g., "GEP"
  receiver_address: string;
  receiver_plain_address: string | null;
  sender_address: string;
  sender_plain_address: string | null;
  article_desc: string;
  created_at: string; // "30th September, 2025 03:27:31 PM"
  updated_at: string;
  booking_info: ArticleBookingInfo[];
  barcodes: string[];
  additional_services: ArticleAdditionalService[];
  images: string[];
  item_id: string; // "DP094100107BD"
  service_name: string; // "parcel"
}

export interface ArticleAddress {
  id: number;
  name: string; // "Suruj"
  title?: string; // null
  email?: string; // null
  division?: string; // null
  division_id?: number; // null
  district?: string; // null
  district_id?: number; // null
  police_station?: string; // null
  police_station_id?: number; // null
  post_office?: string; // null
  post_code?: string; // null

}

// {
//     "id": 1540,
//     "name": "Suruj",
//     "title": null,
//     "email": null,
//     "division": null,
//     "division_id": null,
//     "district": null,
//     "district_id": null,
//     "police_station": null,
//     "police_station_id": null,
//     "post_office": null,
//     "post_code": null,
//     "post_office_id": null,
//     "country": "Bangladesh",
//     "country_id": 18,
//     "zone": "Other Asian Countries",
//     "zone_id": 2,
//     "user_id": null,
//     "address": "",
//     "phone": "01908649288",
//     "person_type": "receiver",
//     "address_type": "DOMESTIC",
//     "created_at": "30th September, 2025 03:44:49 PM",
//     "updated_at": null
// }

export interface ArticleServiceType {
  key: string; // "3"
  name: string; // "parcel"
  label: string; // "পার্সেল"
  description: string; // "parcel"
}

export interface ArticleBookingInfo {
  id: number;
  booked_by: string; // "1000005"
  booked_branch: string; // "Dhaka GPO (100000)"
  service_type: string; // "parcel"
  shift: string | null;
  booked_at: string; // "30th September, 2025 03:27:46 PM"
  updated_at: string;
  booked_user_id: number | null;
  status_active: boolean;
  is_delete: boolean;
  article: number; // article id (2414)
}

export interface ArticleAdditionalService {
  additional_service: string; // "gep" | "ad_pod" | "vp" | "insurance"
  cost: string; // e.g., "5.00"
  value: string; // e.g., "GEP", "AD", "1000.0", "100.0"
  name: string;
  bn_name: string;
}
// ---------- Input to the mutation ----------

export interface CreateDmsArticleInput {
  token: string;                 // bearer token (header only)
  payload: DmsCreateArticleRequest;    // actual API body
}

export interface DmsPrintJobRequestPayload {
  barcode: string;
  print_type: string;
  printer_id: string;
  job_type: string;
  command: string;
}

export interface DmsPrintJobRequest {
  payload: DmsPrintJobRequestPayload;
  token: string;
}

export interface DmsPrintApiResponse {
  status: string;
  job_id: string;
  message: string;
  printed_by?: string;
  printer_id?: string;
  barcode?: string;
  job_status?: string;
}


export interface DmsPrintJobResponse {
  status: string;
  status_code: number;
  message: string;
  print_api_response: DmsPrintApiResponse;
}


export interface BookDmsArticleInput {
  token: string;                 // bearer token (header only)
  barcode: string;               // barcode of the article to book
}




export const post_type_to_number = (post_type: PostType): number => {
  switch (post_type) {
    case PostType["DOMESTIC"]: {
      return 1
    }
    case PostType["INTERNATIONAL"]: {
      return 2
    }

    default: {
      return 1
    }
  }
}

export const number_to_post_type = (post_type_number: number): PostType => {
  // console.log("post_type_number", post_type_number)
  // console.log("post_type_number type", typeof (post_type_number))
  switch (post_type_number) {
    case 1: {
      return PostType["DOMESTIC"]
    }
    case 2: {
      return PostType["INTERNATIONAL"]
    }

    default: {
      return PostType["DOMESTIC"]
    }
  }
}




// DMS Additional Service Types
export interface DmsAdditionalService {
  additional_service: string;
  cost: string;
  value: string;
  name: string;
  bn_name: string;
}

// DMS Event Types
export interface DmsEvent {
  id: number;
  event_type: string;
  instruction: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  destination_branch: number | null;
  creation_branch: number | null;
  received_branch: number | null;
  location: string | null;
  device: number | null;
  print_task_uuid: string | null;
  ad_task_uuid: string | null;
  receipt_task_uuid: string | null;
}

// DMS Service Type
export interface DmsServiceType {
  key: string;
  name: string;
  label: string;
  description: string;
}

// DMS Booking Info
export interface DmsBookingInfo {
  id: number;
  booked_by: string;
  booked_branch: string;
  service_type: string;
  shift: string | null;
  booked_at: string;
  updated_at: string;
  booked_user_id: string | null;
  status_active: boolean;
  is_delete: boolean;
  article: number;
}

export interface FetchPostDmsResponseWrapper {
  status: string;
  message: string;
  data: PostDms | null
}

export interface PostDms {
  id: number;
  emts_branch_code: string;
  service_type: DmsServiceType;
  service_charge: number;
  weight: number;
  length: number;
  barcode: string;
  status: string;
  width: number;
  height: number;
  isCharge: string;
  isStation: string;
  delivery_branch: string;
  article_price: string;
  insurance_price: string;
  is_bulk_mail: string;
  city_post_status: string;
  is_city_post: string;
  vas_type: string;
  receiver_address: string;
  receiver_plain_address: string | null;
  sender_address: string;
  sender_plain_address: string | null;
  article_desc: string;
  created_at: string;
  updated_at: string;
  booking_info: DmsBookingInfo[];
  barcodes: any[];
  additional_services: DmsAdditionalService[];
  images: any[];
  item_id: string;
  service_name: string;
  events: DmsEvent[];
}



// Request types
export interface OperatorDebitRequest {
  token?: string;
  reference: string;
  amount: number;
  barcode: string;
}

// Response types
export interface User {
  id: number;
  username: string;
  uuid: string;
}

export interface Admin {
  id: number;
  username: string;
  uuid: string;
}

export interface AccountOwner {
  user?: User;
  admin?: Admin;
}

export interface Account {
  id: number;
  account_name: string | null;
  account_number: string;
  account_owner: AccountOwner;
}

export interface CreditLedger {
  id: number;
  amount: number;
  reference: string;
  entry_type: "credit";
  transaction_type: "credit";
  to_account: Account;
  to_account_current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface DebitLedger {
  id: number;
  amount: number;
  reference: string;
  entry_type: "debit";
  transaction_type: "debit";
  from_account: Account;
  from_account_current_balance: number;
  to_account: Account;
  to_account_current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface OperatorDebitData {
  credit_ledger: CreditLedger;
  debit_ledger: DebitLedger;
}

export interface OperatorDebitResponse {
  status: string;
  message: string;
}
