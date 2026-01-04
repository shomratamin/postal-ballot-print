import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { UserInfoUpdate, UserInfoUpdateResponse } from "../store/user/types";

const userInfoUpdate = async (data: UserInfoUpdate): Promise<UserInfoUpdateResponse> => {
    const formData = new FormData();
    formData.append("legal_name", data.legal_name);
    formData.append("username", data.username);
    formData.append("nid_no", data.nid_no);
    formData.append("email", data.email);
    formData.append("phone_number", `+88${data.phone_number}`);
    formData.append("avatar", data.avatar);

    const access = Cookies.get("access") || "";

    try {
        // const response = await fetch(`/user/update-info/`, {
        //     headers: {
        //         Authorization: `Bearer ${access}`,
        //     },
        // });

        // console.log("response ---->", response);
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/user/update-info/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access}`,
            },
            // use formData as body
            body: formData

        });
        console.log("response data --->", response);

        const res_data = await response.json();
        console.log("response json for OTP --->", res_data);

        return {
            message: res_data.message,
            status: res_data.status,
        };
    }
    catch (error: any) {
        console.error("API Error:", error);

        if (error.response) {
            // Extract the correct error message
            const errorMessage = error.res_data?.error || error.res_data?.message || "An error occurred";

            return {
                message: errorMessage,
                status: error.res_data?.status_code?.toString() || error.response.status.toString() || "500",
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

export const useUserInfoUpdate = () => {
    return useMutation({ mutationFn: userInfoUpdate });
};
