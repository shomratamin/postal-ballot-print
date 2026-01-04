import { useMutation } from "@tanstack/react-query";
import { PrintJobRequest, PrintJobResponse, VpReceiveRequest, VpReceiveResponse } from "../store/common/types";

let emptyReceiveVpResponse: VpReceiveResponse = {
    status: "error",
    message: "Error receiving VP Money",
    status_code: 4000
}


const receiveVpAmount = async (vpReceiveRequest: VpReceiveRequest): Promise<VpReceiveResponse> => {

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/receive-vp/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${vpReceiveRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "barcode": vpReceiveRequest.barcode
            })
        });

        console.log("response data --->", response);

        const data = await response.json();
        console.log("response json --->", data);



        if (response.status === 401) {
            return emptyReceiveVpResponse
        }
        if (data.length === 0) {
            return emptyReceiveVpResponse
        }

        emptyReceiveVpResponse.status = data.status
        emptyReceiveVpResponse.message = data.message
        emptyReceiveVpResponse.status_code = data.status_code

        return emptyReceiveVpResponse

    }
    catch (error: any) {

        return emptyReceiveVpResponse
    }

};


export const useReceiveVpAmount = () => {
    return useMutation({ mutationFn: receiveVpAmount })
};

