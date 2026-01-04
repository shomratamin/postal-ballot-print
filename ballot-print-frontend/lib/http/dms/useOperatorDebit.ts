"use server"
import { OperatorDebitRequest, OperatorDebitResponse } from "@/lib/store/post/types";

import { cookies } from "next/headers";


// API function
export const operatorDebit = async (
    request: OperatorDebitRequest,
): Promise<OperatorDebitResponse> => {
    console.log("operatorDebit request", request)
    let cookieStore = await cookies();
    let access_token = cookieStore.get("access")?.value || ""
    let url = `https://accounting.ekdak.com/api/v1/operatorDebit//api/v1/operatorDebit/`;
    // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/operatorDebit/`;
    const response = await fetch(url, {
        method: "POST",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify(request),
    });
    console.log("got debit response -> ", response)

    if (response.status == 401) {
        // unauthorized or token expired
        // await logout_user()
        return {
            status: "failed",
            message: "Unauthorized Access."
        }
    }

    if (!response.ok) {
        return {
            status: "failed",
            message: "Server Status Non ok."
        }
    }
    return {
        status: "success",
        message: "Operator Debit Successful."
    }
};

