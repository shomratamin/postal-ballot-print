import { useQuery } from "@tanstack/react-query";
import { ArticleEventListRequestParams, ArticleEventPaginationResponse } from "@/lib/store/common/types";



function formatToISO(dateStr: string): string {
    const [d, m, yAndTime] = dateStr.split("-");
    const [year, time] = yAndTime.split(" ");
    const formatted = `${year}-${m}-${d}`; // YYYY-MM-DD
    return time ? `${formatted}T${time}` : formatted;
}
export const emptyArticlePaginationResponse: ArticleEventPaginationResponse = {
    success: "success",
    message: "",
    current_page: 1,
    total_pages: 0,
    total_items: 0,
    page_size: 0,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null,
    event_totals: {
        Total_CREATED: 0,
        Total_PRINTED: 0,
        Total_AD_PRINTED: 0,
        Total_RECEIPT_PRINTED: 0,
        Total_BOOKED: 0,
        Total_BAGGED: 0,
        Total_REMOVED: 0,
        Total_RECEIVED: 0,
        Total_FORWARDED: 0,
        Total_UNBAGGED: 0,
        Total_DELIVERED: 0,
        Total_RETURN_CREATED: 0,
        Total_RETURN_DELIVERED: 0
    },
    data: []
};


const getArticleEvent = async (token: string, queryParams: ArticleEventListRequestParams): Promise<ArticleEventPaginationResponse> => {
    try {
        const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/get-article-event/`);

        console.log("queryParams.barcode", queryParams.barcode);
        console.log("queryParams.event_type", queryParams.event_type);

        if (queryParams.barcode) {
            url.searchParams.append("barcode", queryParams.barcode);
        }
        if (queryParams.event_type) {
            url.searchParams.append("event_type", queryParams.event_type);
        }
        if (queryParams.from_date) {
            const fromDate = formatToISO(queryParams.from_date);
            url.searchParams.append("from_date", fromDate);
        }
        if (queryParams.to_date) {
            const toDate = formatToISO(queryParams.to_date);
            url.searchParams.append("to_date", toDate);
        }
        if (queryParams.service_type) {
            url.searchParams.append("service_type", queryParams.service_type);
        }


        url.searchParams.append("page", String(queryParams.page) || "1");
        url.searchParams.append("page_size", String(queryParams.page_size || "10"));


        console.log("url", url.toString());
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
        console.error("Error fetching DMS booking:", error);
        return emptyArticlePaginationResponse;
    }

};

export const useGetArticleEvent = (token: string, queryParams: ArticleEventListRequestParams) => {
    return useQuery({
        queryKey: ['get-article-event', queryParams],
        queryFn: () => getArticleEvent(token, queryParams),
    });
};