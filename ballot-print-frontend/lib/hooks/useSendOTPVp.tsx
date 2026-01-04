import { useMutation } from "@tanstack/react-query";
import { VpSendOTPRequest, VpReceiveResponse } from "../store/common/types";

let emptySendOTPVpResponse: VpReceiveResponse = {
    status: "error",
    message: "Error sending VP OTP",
    status_code: 4000
}


const sendOTPVP = async (vpSendOTPRequest: VpSendOTPRequest): Promise<VpReceiveResponse> => {

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/send-payment-otp/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${vpSendOTPRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "barcode": vpSendOTPRequest.barcode
            })
        });

        console.log("response data --->", response);

        const data = await response.json();
        console.log("response json for OTP --->", data);



        if (response.status === 401) {
            return emptySendOTPVpResponse
        }
        if (data.length === 0) {
            return emptySendOTPVpResponse
        }

        emptySendOTPVpResponse.status = data.status
        emptySendOTPVpResponse.message = data.message
        emptySendOTPVpResponse.status_code = data.status_code

        return emptySendOTPVpResponse

    }
    catch (error: any) {

        return emptySendOTPVpResponse
    }

};


export const useSendOTPVp = () => {
    return useMutation({ mutationFn: sendOTPVP })
};

