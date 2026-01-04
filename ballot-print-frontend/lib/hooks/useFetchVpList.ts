import { useQuery } from "@tanstack/react-query";
import { VpListPaginationResponse, VpGetQueryParams } from "@/lib/store/common/types";




export const emptyArticlePaginationResponse: VpListPaginationResponse = {
    success: "success",
    message: "",
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    page_size: 0,
    previous_page: null,
    status_code: 200,
    data: []
};

const fetchVpList = async (token: string, queryParams: VpGetQueryParams): Promise<VpListPaginationResponse> => {
    console.log("fetchVpList queryParams:", queryParams);
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/get-vp-info-list/`);

        // console.log("queryParams.barcode", queryParams.barcode);
        // console.log("queryParams.event_type", queryParams.event_type);

        if (queryParams.from_date) {
            console.log("from_date", queryParams.from_date);
            url.searchParams.append("from_date", queryParams.from_date);
        }

        if (queryParams.to_date) {
            console.log("to_date", queryParams.to_date);
            url.searchParams.append("to_date", queryParams.to_date);
        }


        url.searchParams.append("page", String(queryParams.page));
        url.searchParams.append("page_size", String(queryParams.page_size));
        if (queryParams.search) {
            url.searchParams.append("search", String(queryParams.search));
        }
        if (queryParams.paid_status && queryParams.paid_status !== 'all') {
            url.searchParams.append("paid_status", String(queryParams.paid_status));
        }
        if (queryParams.received_status && queryParams.received_status !== 'all') {
            url.searchParams.append("received_status", String(queryParams.received_status));
        }
        if (queryParams.otp_status && queryParams.otp_status !== 'all') {
            url.searchParams.append("otp_status", String(queryParams.otp_status));
        }
        if (queryParams.service_type && queryParams.service_type !== 'all') {
            url.searchParams.append("service_type", String(queryParams.service_type));
        }

        console.log("vp list url", url.toString());
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                // Authorization: `Bearer ${tok}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },

        });

        const data = await response.json();
        console.log("Fetched VP List Data:", data);
        return data;
    } catch (error: any) {
        console.error("Error fetching DMS booking:", error);
        return emptyArticlePaginationResponse;
    }

};

export const useFetchVpList = (token: string, queryParams: VpGetQueryParams) => {
    return useQuery({
        queryKey: ['dms-vp-list', queryParams],
        queryFn: () => fetchVpList(token, queryParams),
    });
};