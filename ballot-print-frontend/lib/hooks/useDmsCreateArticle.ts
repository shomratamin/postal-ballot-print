import { useMutation } from "@tanstack/react-query";
import { DmsCreateArticleApiResponse, CreateDmsArticleInput } from "../store/post/types";

let emptyDMSCreateArticleResponse: DmsCreateArticleApiResponse = {
    status: "error",
    message: "Error creating DMS booking",
    status_code: 4000,
    ad_barcode: "",
    article_id: 0,
    article_uuid: "",
    barcode: "",
    total_charge: ""
}

const createDmsArticle = async (bookingRequest: CreateDmsArticleInput): Promise<DmsCreateArticleApiResponse> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/create-article/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bookingRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingRequest.payload)
        });

        console.log("response data --->", response);

        const data = await response.json();
        console.log("response json --->", data);


        if (response.status === 401) {
            return emptyDMSCreateArticleResponse
        }
        if (data.length === 0) {
            return emptyDMSCreateArticleResponse
        }

        return data

    }
    catch (error: any) {
        console.log("error", error.message);
        return emptyDMSCreateArticleResponse
    }
};

export const useDmsCreateArticle = () => {
    return useMutation({
        mutationFn: createDmsArticle
    })
};
