// types.ts (or wherever you keep your API interfaces)

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
  account_name: string | null;
  account_number: string;
  account_owner: AccountOwner;
  id: number;
}

export interface PostpaidBill {
  Amount: number;
  ApproverAccount: Account;
  ApproverAccountID: number;
  CreatedAt: string;
  ID: number;
  IsDelete: number;
  ReceiverAccount: Account;
  ReceiverAccountID: number;
  Reference: string;
  SenderAccount: Account;
  SenderAccountID: number;
  UpdatedAt: string;
  approved_at: string | null;
  bill_uuid: string;
  bill_id?: string;
  is_approved: boolean;
  is_paid: boolean;
  is_sent: boolean;
  paid_at: string | null;
  sent_at: string | null;
}

export interface Pagination {
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface AccountDetailsResponse {
  data: PostpaidBill[];
  pagination: Pagination;
  status: string;
  message?: string;  // if your API returns an error message field
}


// types/postDebitBill.ts
export type PostDebitBillPayload = {
  ledger_ids: Array<number | string>;
};

export interface PostDebitBillResponse {
  status: "success" | "failed";
  message: string;
  data: {
    bill: {
      Amount: number;
      ApproverAccountID: number;
      ReceiverAccountID: number;
      SenderAccountID: number;
      CreatedAt: string; // ISO
      UpdatedAt: string; // ISO
      ID: number;
      IsDelete: number;
      Reference: string;
      bill_uuid: string;
      is_approved: boolean;
      is_paid: boolean;
      is_sent: boolean;
      approved_at: string | null;
      paid_at: string | null;
      sent_at: string | null;
      ApproverAccount: {
        id: number;
        account_name: string | null;
        account_number: string;
        account_owner: {
          user: {
            id: number;
            username: string;
            uuid: string;
          };
        };
      };
      ReceiverAccount: {
        id: number;
        account_name: string | null;
        account_number: string;
        account_owner: {
          admin: {
            id: number;
            username: string;
            uuid: string;
          };
        };
      };
      SenderAccount: {
        id: number;
        account_name: string | null;
        account_number: string;
        account_owner: {
          user: {
            id: number;
            username: string;
            uuid: string;
          };
        };
      };
    };
    ledger_ids: Array<number>;
    total_amount: number;
  } | null;
}







export interface CorporateResponse {
  status: string;
  status_code: number;
  message: string;
  page: number;
  per_page: number;
  total_records: number;
  total_charge_sum: string;
  vp_service_count: number;
  request_info?: {
    page: number;
    per_page: number;
    records_returned: number;
  };
  filters_applied?: {
    from_date: string;
    from_time: string;
    to_date: string;
    to_time: string;
    search: string | null;
  };
  data: CorporateResponseItem[];
}



export interface CorporateResponseItem {
  Amount_Insurance: string;
  Ben_Contact: string;
  Book_Process_Branch_Code: string;
  Book_Process_Date: string;
  Book_Process_Time: string;
  Book_Process_User_ID: string;
  Charge_AD: string;
  Charge_Insurance: string;
  Charge_Item_Price: string;
  Charge_VAS: string;
  Charge_Weight: string;
  Collection_Gateway_Additional_Charge: string;
  Collection_Gateway_My_Charge: string;
  Collection_Gateway_Name: string;
  Collection_Gateway_Net_Amount_Sender: string;
  Collection_Gateway_Status: string;
  Collection_Gateway_Trans_ID: string;
  Collection_Type: string;
  Data_Source: string;
  Delivery_Branch_Code: string;
  Electronic_Charge: number;
  Entry_Flag: string;
  Insert_Date: string;
  Insert_Time: string;
  Intimation_Charge: string;
  Is_AD: string;
  Item_ID: string;
  Item_Price: string;
  Item_Real_Price: string;
  Item_Status: string;
  Late_Fee: string;
  Product_ID: string;
  Product_Note: string;
  Remarks: string;
  Sender_ID: string;
  Service_Type: string;
  Total_Charge: string;
  Total_Weight: string;
  Unit_Weight: string;
  User_Access_Type: string;
  User_Address: string;
  User_Cast: string;
  User_Created_Date_Time: string;
  User_Date_of_Birth: string;
  User_Email: string;
  User_Gender: string;
  User_ID: string;
  User_Is_SMS_Notify_Post_Booked: string;
  User_Locking_Reason: string;
  User_Locking_Status: string;
  User_NID: string;
  User_Name: string;
  User_Password: string;
  VAS_Type: string;
  VP_Service: string;
  ben_address: string;
  ben_name: string;
}















// Barcode scanner types
// Minimal, safe ambient declarations for browsers that ship BarcodeDetector.
// If lib.dom catches up in your TS version, this file won't harm anything.
declare global {
  type BarcodeFormat =
    | "aztec"
    | "code_128"
    | "code_39"
    | "code_93"
    | "codabar"
    | "data_matrix"
    | "ean_13"
    | "ean_8"
    | "itf"
    | "pdf417"
    | "qr_code"
    | "upc_a"
    | "upc_e";

  interface DetectedBarcode {
    boundingBox?: DOMRectReadOnly;
    cornerPoints?: { x: number; y: number }[];
    rawValue?: string;
    format?: BarcodeFormat;
  }

  interface BarcodeDetectorOptions {
    formats?: BarcodeFormat[];
  }

  interface BarcodeDetector {
    detect(source: CanvasImageSource | ImageBitmap | ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedBarcode[]>;
  }

  var BarcodeDetector: {
    new(options?: BarcodeDetectorOptions): BarcodeDetector;
    getSupportedFormats?: () => Promise<BarcodeFormat[]>;
  };
}

export { };
