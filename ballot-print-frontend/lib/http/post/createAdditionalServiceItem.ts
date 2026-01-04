"use server"
import { AdditionalServiceItemStoreRequest, AdditionalServiceItemStoreResponse, } from "@/lib/store/post/types";
import { logout_user } from "@/lib/store/user/actions";
import { cookies } from "next/headers";

export const createAdditionalServiceItemsDB = async (additionalServiceItems: AdditionalServiceItemStoreRequest[]): Promise<AdditionalServiceItemStoreResponse[]> => {
    let cookieStore = await cookies()
    let data = {
        data: additionalServiceItems
    }

    console.log("ADDITIONAL_SERVICE_ITEMS_CREATE", data)
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/additionalServiceItem-store`, {
        cache: "no-cache",
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    const result_post = await response.json()
    console.log("ADDITIONAL_SERVICE_ITEMS_RESULT -> ", result_post)
    if (response.status == 401) {
        // unauthorized or token expired
        await logout_user()
        throw new Error("Unauthorized")
    }
    if (!response.ok) {
        // console.log("response create AdditionalServiceItems", response)
        throw new Error("Failed to create AdditionalServiceItems.")
    }


    // console.log("got AdditionalServiceItems create response -> ", result_post)

    let additionalServiceStoreResponses: AdditionalServiceItemStoreResponse[] = []
    result_post.forEach((item: ResponseItem) => {
        additionalServiceStoreResponses.push(item.data)
    })


    // console.log("Map Service Item Store Response", additionalServiceStoreResponses)
    return additionalServiceStoreResponses

}




interface ResponseItem {
    data: AdditionalServiceItemStoreResponse;
    message: string;
    status: number
}
