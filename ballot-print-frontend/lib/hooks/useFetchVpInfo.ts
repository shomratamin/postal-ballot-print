import { useQuery } from "@tanstack/react-query";
import { VpInfoResponse } from "@/lib/store/common/types";




export const emptyVpinfoResponse: VpInfoResponse = {
    success: "success",
    message: "",
    status_code: 200,
    data: null
};

const fetchVpInfo = async (token: string, barcode: string): Promise<VpInfoResponse> => {
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/get-vp-information/?barcode=${barcode}`);

        console.log("vp info url", url.toString());
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                // Authorization: `Bearer ${tok}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },

        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Error fetching Vp Info:", error);
        return emptyVpinfoResponse;
    }

};

export const useFetchVpInfo = (token: string, barcode: string) => {
    return useQuery({
        queryKey: ['dms-vp-info', barcode],
        queryFn: () => fetchVpInfo(token, barcode),
    });
};