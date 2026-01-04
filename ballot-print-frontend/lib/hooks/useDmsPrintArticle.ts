import { useMutation } from "@tanstack/react-query";
import { DmsCreateArticleApiResponse, CreateDmsArticleInput, DmsPrintJobRequest, DmsPrintJobResponse } from "../store/post/types";

let emptyDMSCreateArticleResponse: DmsPrintJobResponse = {
    status: "error",
    message: "Error creating DMS booking",
    status_code: 4000,
    print_api_response: {
        status: "error",
        message: "No data",
        job_id: "",
    }
}

const printDmsArticle = async (printRequest: DmsPrintJobRequest): Promise<DmsPrintJobResponse> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/article-print/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${printRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(printRequest.payload)
        });

        console.log("response data --->", response);

        const data: DmsPrintJobResponse = await response.json();
        console.log("response json --->", data);


        if (response.status === 401) {
            return emptyDMSCreateArticleResponse
        }


        return data

    }
    catch (error: any) {
        console.log("error", error.message);
        return emptyDMSCreateArticleResponse
    }
};

export const useDmsPrintArticle = () => {
    return useMutation({
        mutationFn: printDmsArticle
    })
};
