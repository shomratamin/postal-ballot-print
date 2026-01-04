import {
    AccountDetailsResponse,
    CorporateResponse,
    CorporateResponseItem,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface CorporateQueryParams {
    page?: number;
    per_page?: number;
    from_time?: string;
    to_time?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
}

const initialCorporateData: CorporateResponse = {
    status: "error",
    status_code: 500,
    message: "No data available",
    page: 0,
    per_page: 0,
    total_records: 0,
    total_charge_sum: "0.00",
    vp_service_count: 0,
    request_info: {
        page: 0,
        per_page: 0,
        records_returned: 0,
    },
    filters_applied: {
        from_date: "",
        from_time: "",
        to_date: "",
        to_time: "",
        search: null,
    },
    data: [],
};

const getCorporateUserData = async (token: string, queryParams?: CorporateQueryParams): Promise<CorporateResponse> => {

    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.append("page", queryParams.page.toString());
        if (queryParams?.per_page)
            params.append("per_page", queryParams.per_page.toString());
        if (queryParams?.from_date)
            params.append("from_date", queryParams.from_date);
        if (queryParams?.to_date) params.append("to_date", queryParams.to_date);
        if (queryParams?.from_time)
            params.append("from_time", queryParams.from_time);
        if (queryParams?.to_time) params.append("to_time", queryParams.to_time);
        if (queryParams?.search) params.append("search", queryParams.search);
        const queryString = params.toString();



        const url = `${process.env.NEXT_PUBLIC_EKDAK_API_URL}/v1/dms-legacy-core-logs/get-item-user-data?${queryString}`;


        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        const apiResponse = (await response.json());

        console.log("✅ Corporate API Response:", apiResponse);

        // Handle failed response
        if (!response.ok || apiResponse.status !== "success") {
            console.error("API returned error:", apiResponse.message);
            return initialCorporateData;
        }

        return apiResponse;
    }

    catch (error: any) {
        console.error(" getCorporateUserData error:", error.message);
        return initialCorporateData;
    }
};





export const useCorporateUserData = (token: string, queryParams?: CorporateQueryParams
) => {
    return useQuery({
        queryKey: ["get_dms_corporate_user_data", token, queryParams],
        queryFn: () => getCorporateUserData(token, queryParams),
        enabled: !!token,
    });
};
