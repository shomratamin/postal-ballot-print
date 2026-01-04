import { useMutation } from "@tanstack/react-query";
import { VpPayMoneyRequest, VpReceiveResponse } from "../store/common/types";

let emptySendOTPVpResponse: VpReceiveResponse = {
    status: "error",
    message: "Error Paying VP Money",
    status_code: 4000
}


const payVpWithOTP = async (vpSendOTPRequest: VpPayMoneyRequest): Promise<VpReceiveResponse> => {

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/pay-with-otp/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${vpSendOTPRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "barcode": vpSendOTPRequest.barcode,
                "otp": vpSendOTPRequest.otp
            })
        });

        console.log("response data --->", response);

        const data = await response.json();
        console.log("response json --->", data);



        if (response.status === 401) {
            return { ...emptySendOTPVpResponse, message: data.message }
        }
        if (data.length === 0) {
            return emptySendOTPVpResponse
        }


        return data

    }
    catch (error: any) {

        return emptySendOTPVpResponse
    }

};


export const usePayWithOTP = () => {
    return useMutation({ mutationFn: payVpWithOTP })
};

