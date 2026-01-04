import { useQuery } from "@tanstack/react-query";
import { EnvelopeListResponse, EnvelopeListRequestParams } from "../store/envelope/types";


export const emptyEnvelopeListResponse: EnvelopeListResponse = {
    message: "",
    status: 200,
    data: {
        filters: {},
        envelopes: [],
        pagination: {
            current_page: 1,
            has_next_page: false,
            has_prev_page: false,
            next_page: null,
            page_size: 10,
            prev_page: null,
            total_pages: 0,
            total_records: 0,
        },
    },
};

const fetchEnvelopeList = async (token: string, queryParams: EnvelopeListRequestParams = {}): Promise<EnvelopeListResponse> => {
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/order/order-list`);

        if (queryParams.search) {
            url.searchParams.append("search", queryParams.search);
        }
        if (queryParams.from_date) {
            url.searchParams.append("from_date", String(queryParams.from_date));
        }
        if (queryParams.to_date) {
            url.searchParams.append("to_date", String(queryParams.to_date));
        }
        if (queryParams.page) {
            url.searchParams.append("page", String(queryParams.page));
        }
        if (queryParams.per_page) {
            url.searchParams.append("per_page", String(queryParams.per_page));
        }

        console.log("Fetching envelope list with URL:", url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            const errorText = await response.text();
            console.error("Error response body:", errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched envelope list:", data);
        // Map backend 'orders' to frontend 'envelopes'
        return {
            ...data,
            data: {
                ...data.data,
                envelopes: data.data.orders || [],
            }
        };
    } catch (error: any) {
        console.error("Error fetching envelope list:", error);
        return emptyEnvelopeListResponse;
    }
};

export const useFetchEnvelopeList = (token: string, queryParams: EnvelopeListRequestParams = {}) => {
    return useQuery({
        queryKey: ['envelope-list', queryParams],
        queryFn: () => fetchEnvelopeList(token, queryParams),
    });
};
