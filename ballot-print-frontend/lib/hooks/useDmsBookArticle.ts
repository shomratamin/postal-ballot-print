import { useMutation } from "@tanstack/react-query";
import { DmsBookArticleApiResponse, BookDmsArticleInput } from "../store/post/types";

let emptyDMSCreateArticleResponse: DmsBookArticleApiResponse = {
    status: "failed",
    message: "Error creating DMS booking",
    status_code: 4000,
    data: null
};

const bookDmsArticle = async (bookingRequest: BookDmsArticleInput): Promise<DmsBookArticleApiResponse> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/book-article-web/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bookingRequest.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ barcode: bookingRequest.barcode })
        });

        console.log("response data --->", response);

        const data: DmsBookArticleApiResponse = await response.json();
        console.log("response article book data json --->", data);


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

export const useDmsBookArticle = () => {
    return useMutation({
        mutationFn: bookDmsArticle
    })
};
