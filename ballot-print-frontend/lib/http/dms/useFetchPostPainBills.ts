import { AccountDetailsResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface ErrorResponse {
  message: string;
}







const initialPostPaidBills: AccountDetailsResponse = {
  data: [],
  pagination: {
    current_page: 0,
    has_next: false,
    has_prev: false,
    per_page: 0,
    total: 0,
    total_pages: 0,
  },
  status: "error",
  message: "No data available",
};





const getPostPaidBills = async (token: string, queryParams?: any): Promise<AccountDetailsResponse> => {
  try {
    // Build query string from parameters
    const params = new URLSearchParams();
    if (queryParams?.page) params.append('page', queryParams.page.toString());
    if (queryParams?.per_page) params.append('per_page', queryParams.per_page.toString());
    // if (queryParams?.from_date) params.append('from_date', queryParams.from_date);
    // if (queryParams?.to_date) params.append('to_date', queryParams.to_date);
    if (queryParams?.entry_type) params.append('entry_type', queryParams.entry_type);
    if (queryParams?.from_account) params.append('from_account', queryParams.from_account);
    if (queryParams?.to_account) params.append('to_account', queryParams.to_account);

    const queryString = params.toString();
    // const url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/operator-postpaid-bills${queryString ? '?' + queryString : ''}`;
    const url = `https://accounting.ekdak.com/api/v1/operator-postpaid-bills${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const apiResponse = await response.json();

    // handle empty or error status
    if (!response.ok || apiResponse.status !== "success") {
      console.error("API returned error:", apiResponse.message);
      return initialPostPaidBills;
    }

    return apiResponse as AccountDetailsResponse;
  } catch (error: any) {
    console.error("getPostPaidBills error:", error.message);
    const errorResponse: ErrorResponse = {
      message: error.message,
    };
    return initialPostPaidBills;
  }
};



export const usePostPaidBills = (token: string, queryParams?: any) => {
  return useQuery({
    queryKey: ["get_dms_post_paid_bills", token, queryParams],
    queryFn: () => getPostPaidBills(token, queryParams),
    enabled: !!token,
  });
};
