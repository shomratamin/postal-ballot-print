"use server"
import { INITIAL_RECIPIENT, INITIAL_SENDER } from "@/lib/store/person/store";
import { PostUpdatePersonRequest } from "@/lib/store/person/types";
import { Post, PostStoreResponseWrapper, number_to_post_type, post_type_to_number } from "@/lib/store/post/types";
import { logout_user } from "@/lib/store/user/actions";
import { cookies } from "next/headers";

export const updatePostPersonDB = async (post: PostUpdatePersonRequest): Promise<PostStoreResponseWrapper> => {
    let cookieStore = await cookies()
    console.log("got updatePostPersonDB", post)

    const formData = new FormData();

    if (post.step) formData.append('step', `${post.step}`);
    if (post.recipient_id) formData.append('recipient_id', `${post.recipient_id}`);
    if (post.sender_id) formData.append('sender_id', `${post.sender_id}`);

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/post-update/${post.post_id}`, {
            cache: "no-cache",
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
            body: formData
        })
        const result_post = await response.json()
        console.log("got result update post", result_post)
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            throw new Error("Unauthorized")
        }
        if (!response.ok) {
            // console.log("response login", response)
            throw new Error("Failed to update Post.")
        }
        // console.log("got result update post", result_post)

        let postStoreResponse: Post = {
            id: result_post.data.id,
            step: result_post.data.step,
            service_bn_name: result_post.data.service_bn_name,
            service_name: result_post.data.service_name,
            weight: Number(result_post.data.weight),
            type: number_to_post_type(Number(result_post.data.type)),
            description: result_post.data.description,
            service_id: Number(result_post.data.service_id),
            service_item_id: Number(result_post.data.service_item_id),
            service_cost: Number(result_post.data.service_cost),
            additional_service_cost: Number(result_post.data.additional_service_cost),
            total_cost: Number(result_post.data.total_cost),
            sender: result_post.data.sender || INITIAL_SENDER,
            recipient: result_post.data.recipient || INITIAL_RECIPIENT,
            weight_upper: Number(result_post.data.weight_upper),
            weight_lower: Number(result_post.data.weight_lower),
            status: result_post.data.status,
            additional_service_items: result_post.data.additional_service_items,
            barcode: result_post.data.barcode,
            zone: result_post.data.zone,
            country: result_post.data.country,
            zone_id: result_post.data.zone_id,
            country_id: result_post.data.country_id,
            created_by: result_post.data.created_by,
            created_at: result_post.data.created_at,
            updated_at: result_post.data.updated_at,
        }
        // console.log("postStoreResponse", postStoreResponse)
        return {
            status: "success",
            message: "Post updated successfully",
            data: postStoreResponse
        }
    } catch (err) {
        console.log("error in post update", err)
        return {
            status: "failed",
            message: "Post update failed",
            data: null
        }
    }






}