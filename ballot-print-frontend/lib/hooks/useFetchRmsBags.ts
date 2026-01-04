import { useQuery } from "@tanstack/react-query";
import { RmsBagListRequestParams, RmsBagListResponse } from "@/lib/store/common/types";

export const emptyRmsBagListResponse: RmsBagListResponse = {
    status: "success",
    message: "",
    bags: [],
    total: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false,
    has_previous: false,
};

const fetchRmsBag = async (token: string, queryParams: RmsBagListRequestParams): Promise<RmsBagListResponse> => {
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/get-bag-lists/`);

        if (queryParams.search) {
            url.searchParams.append("search", queryParams.search);
        }
        if (queryParams.destination_branch_name) {
            url.searchParams.append("destination_branch_name", String(queryParams.destination_branch_name));
        }
        if (queryParams.rms_destination_branch_name) {
            url.searchParams.append("rms_destination_branch_name", String(queryParams.rms_destination_branch_name));
        }
        if (queryParams.bag_category && queryParams.bag_category !== "ALL") {
            url.searchParams.append("bag_category", String(queryParams.bag_category));
        }
        if (queryParams.bag_type && queryParams.bag_type !== "ALL") {
            url.searchParams.append("bag_type", String(queryParams.bag_type));
        }
        if (queryParams.bag_status) {
            url.searchParams.append("bag_status", String(queryParams.bag_status));
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
        console.log("Fetching RMS bags with URL:", url.toString());
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
        console.log("Fetched RMS bags:", data);
        return data;
    } catch (error: any) {
        console.error("Error fetching RMS bag:", error);
        return emptyRmsBagListResponse;
    }
};

export const useFetchRmsBags = (token: string, queryParams: RmsBagListRequestParams) => {
    return useQuery({
        queryKey: ['rms-bag-list', queryParams],
        queryFn: () => fetchRmsBag(token, queryParams),
    });
};