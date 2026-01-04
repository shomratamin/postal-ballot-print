
import { useQuery } from "@tanstack/react-query";
import { AccountLedgerListParams, AccountLedgerListResponse } from "../store/common/types";

const emptyAccountLedgerList: AccountLedgerListResponse = {
    status: 'error',
    data: [],
    pagination: {
        current_page: 1,
        has_next: false,
        has_prev: false,
        per_page: 20,
        total: 0,
        total_pages: 0
    }
}

const getAccountLedgerList = async (
    token: string,
    params: AccountLedgerListParams = {}
): Promise<AccountLedgerListResponse> => {
    console.log("getAccountLedgerList url", process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL);
    console.log("getAccountLedgerList token", token);
    console.log("getAccountLedgerList params", params);

    try {
        // Build query parameters
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page.toString());
        if (params.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params.from_date) queryParams.append('from_date', params.from_date);
        if (params.to_date) queryParams.append('to_date', params.to_date);
        if (params.entry_type) queryParams.append('entry_type', params.entry_type);
        if (params.transaction_type && params.transaction_type.toLowerCase() !== 'all') queryParams.append('transaction_type', params.transaction_type);
        if (params.from_account) queryParams.append('from_account', params.from_account);
        if (params.to_account) queryParams.append('to_account', params.to_account);

        const queryString = queryParams.toString();
        let url = `https://accounting.ekdak.com/api/v1/account-operator-ledger-list`;
        // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/account-operator-ledger-list`;

        if (queryString) {
            url += `?${queryString}`;
        }

        console.log("account ledger list url", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log("account ledger list response ---->", response);
        console.log("response status:", response.status);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return emptyAccountLedgerList;
        }

        const apiResponse: AccountLedgerListResponse = await response.json();
        console.log("account ledger list data ---->", apiResponse.data);
        console.log("account ledger list pagination ---->", apiResponse.pagination);

        // Check if the API response indicates success
        if (apiResponse.status === 'success') {
            return apiResponse;
        } else {
            console.error("API returned error:", apiResponse);
            return emptyAccountLedgerList;
        }

    } catch (error: any) {
        console.error("account ledger list error", error);
        return emptyAccountLedgerList;
    }
}

export const useDmsAccountLedgerList = (
    token: string,
    params: AccountLedgerListParams = {},
    enabled: boolean = true
) => {
    // Create a stable query key that includes all parameters
    const queryKey = [
        "get_dms_account_ledger_list",
        token,
        params.page,
        params.per_page,
        params.from_date,
        params.to_date,
        params.entry_type,
        params.transaction_type,
        params.from_account,
        params.to_account
    ];

    return useQuery({
        queryKey,
        queryFn: () => getAccountLedgerList(token, params),
    });
}