
// Types for the envelope list API
export interface EnvelopeAddress {
    id: number;
    recipient_fore_name: string;
    recipient_other_name: string;
    postal_address: string;
    zip_code: string;
    city: string;
    phone_no: string;
    qr_id: string;
    country_code: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface EnvelopeReturningAddress {
    id: number;
    district_head_post_office: string;
    zip_code: string;
    district: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface Envelope {
    id: number;
    sequence: number;
    address_id: number;
    returning_address_id: number;
    address: EnvelopeAddress;
    returning_address: EnvelopeReturningAddress;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface EnvelopeListPagination {
    current_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
    next_page: number | null;
    page_size: number;
    prev_page: number | null;
    total_pages: number;
    total_records: number;
}

export interface EnvelopeListResponse {
    message: string;
    status: number;
    data: {
        filters: Record<string, any>;
        envelopes: Envelope[];
        pagination: EnvelopeListPagination;
    };
}

export interface EnvelopeListRequestParams {
    page?: number;
    per_page?: number;
    search?: string;
    from_date?: string;
    to_date?: string;
}