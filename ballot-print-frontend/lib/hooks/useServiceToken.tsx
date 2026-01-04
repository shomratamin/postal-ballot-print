import { useQuery } from "@tanstack/react-query";
import { ServiceTokenRequest, ServiceTokenResponse } from "../store/user/types";




const getServiceToken = async (service_token_request: ServiceTokenRequest): Promise<ServiceTokenResponse | null> => {
    // console.log("useServiceToken called", token);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/service-user-request/`, {
            cache: "no-cache",
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        // console.log("response balance --->", response);
        if (response.status == 401) {
            return null
        }
        const data = await response.json();
        // console.log("response useServiceToken data --->", data);
        if (data.length === 0 || !data.redirect_token || !data.redirect_token.length) {
            return null
        }

        return data

    }
    catch (error: any) {
        // console.log("error useServiceToken", error.message);
        return null
    }

};

export const useServiceToken = (request: ServiceTokenRequest) => {
    return useQuery({
        queryKey: ["check_balance"],
        queryFn: () => getServiceToken(request),
        enabled: false,
        refetchOnWindowFocus: false,
    });
};