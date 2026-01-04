import { useMutation } from "@tanstack/react-query";

import Cookies from "js-cookie";
import { UserInfoUpdateResponse, UserPasswordUpdate } from "../store/user/types";

const userPasswordUpdate = async (data: UserPasswordUpdate): Promise<UserInfoUpdateResponse> => {
    const access = Cookies.get("access") || "";

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/change-user-password/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "old_password": data.old_password,
                "new_password": data.new_password
            })
        });
        console.log("response data --->", response);

        const res_data = await response.json();
        console.log("response json for OTP --->", res_data);


        return {
            message: res_data.message || "Password updated successfully!",
            status: res_data.status || "200",
        };
    }
    catch (error: any) {
        console.error("API Error:", error);

        if (error.response) {
            // Extract the correct error message
            const errorMessage = error.res_data?.error || error.res_data?.message || "An error occurred";
            const statusCode = error.res_data?.status_code?.toString() || error.response.status.toString() || "500";

            return {
                message: errorMessage,
                status: statusCode,
            };
        } else if (error.request) {
            return {
                message: "No response from server",
                status: "500",
            };
        } else {
            return {
                message: error.message || "Unknown error",
                status: "500",
            };
        }
    }
};

export const usePasswordUpdate = () => {
    return useMutation({ mutationFn: userPasswordUpdate });
};
