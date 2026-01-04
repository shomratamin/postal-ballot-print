// 'use server'
import { useQuery } from "@tanstack/react-query"
import { AccountDetailsResponse } from "../store/common/types"

let emptyAccountDetails: AccountDetailsResponse = {
    status: 'error',
    message: 'No data',
    data: {
        account_branch: {
            admin_id: 0,
            branch_account_id: 0,
            branch_account_number: "",
            branch_balance: 0,
            branch_code: "",
            branch_id: 0,
            branch_is_active: false,
            branch_name: "",
            id: 0,
            org_id: 0,
            post_office_branch_id: 0,
            user_id: 0,
        },
        account_personal: {
            account_number: "",
            account_type: "",
            balance_type: "",
            created_at: "",
            currency: "",
            current_balance: 0,
            id: 0,
            is_active: false,
            is_locked: false,
            max_limit: 0,
            updated_at: "",
        },
        user_info: {
            email: null,
            email_verified: false,
            id: 0,
            legal_name: "",
            phone: "",
            phone_verified: false,
            username: "",
            uuid: "",
        }
    }
}

const getAccountDetails = async (token: string): Promise<AccountDetailsResponse> => {
    console.log("getAccountDetails url", process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL)
    console.log("getAccountDetails token", token)

    try {
        let url = `https://accounting.ekdak.com/api/account/get-user-account/`;
        // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/account/get-user-account/`;

        console.log("url account details", url)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log("acc details response ---->", response);
        console.log("response status:", response.status);

        if (!response.ok) {
            return emptyAccountDetails
        }

        const apiResponse: AccountDetailsResponse = await response.json();
        // console.log("acc details full response ---->", apiResponse);
        // console.log("acc details status ---->", apiResponse.status);
        // console.log("acc details message ---->", apiResponse.message);
        console.log("acc details data ---->", apiResponse.data);

        // Check if the API response indicates success
        if (apiResponse.status === 'success' && apiResponse.data) {
            return apiResponse;
        } else {
            console.error("API returned error:", apiResponse.message);
            return emptyAccountDetails;
        }

    } catch (error: any) {
        console.error("acc details error", error);


        return emptyAccountDetails;
    }
}

export const useAccountDetails = (token: string) => {
    return useQuery({
        queryKey: ["get_dms_account_details", token],
        queryFn: () => getAccountDetails(token),
    });
}