"use server"
import { INITIAL_RECIPIENT, INITIAL_SENDER } from "@/lib/store/person/store";
import { Post, PostStoreResponse, PostStoreResponseWrapper, PostUpdateRequest, number_to_post_type, post_type_to_number } from "@/lib/store/post/types";
import { logout_user } from "@/lib/store/user/actions";
import { cookies } from "next/headers";

export const updatePostDB = async (post: PostUpdateRequest): Promise<PostStoreResponseWrapper> => {
    let cookieStore = await cookies()
    try {
        const formData = new FormData();
        formData.append('step', post.step);
        formData.append('service_name', post.service_name);
        formData.append('service_bn_name', post.service_bn_name);
        formData.append('weight', `${post.weight}`);
        formData.append('type', `${post_type_to_number(post.type)}`);
        formData.append('description', `${post.description}`);
        formData.append('service_id', `${post.service_id}`);
        formData.append('service_item_id', `${post.service_item_id}`);
        formData.append('service_cost', `${post.service_cost}`);
        formData.append('total_cost', `${post.total_cost}`);
        formData.append('additional_service_cost', `${post.additional_service_cost}`);
        formData.append('weight_upper', `${post.weight_upper}`);
        formData.append('weight_lower', `${post.weight_lower}`);
        if (post.zone != null && post.zone != "") formData.append('zone', `${post.zone}`);
        if (post.country != null && post.country != "") formData.append('country', `${post.country}`);
        if (post.zone_id != null && post.zone_id != 0) formData.append('zone_id', `${post.zone_id}`);
        if (post.country_id != null && post.country_id != 0) formData.append('country_id', `${post.country_id}`);

        // console.log("##########POST#######UPDATE", post)
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/post-update/${post.id}`, {
            cache: "no-cache",
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
            body: formData
        })

        const result_post = await response.json()
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return {
                status: "failed",
                message: "Unauthorized.",
                data: null
            }
        }
        if (!response.ok) {
            // console.log("response update post", response)
            return {
                status: "failed",
                message: result_post.message,
                data: null
            }
        }

        // console.log("got post update response -> ", result_post)

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

        return {
            status: "success",
            message: "Post updated successfully",
            data: postStoreResponse
        }
    } catch (err) {
        return {
            status: "failed",
            message: "Post update failed",
            data: null
        }
    }


}