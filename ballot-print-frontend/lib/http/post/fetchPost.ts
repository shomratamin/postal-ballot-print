"use server"
import { INITIAL_RECIPIENT, INITIAL_SENDER } from "@/lib/store/person/store"
import { initialPost } from "@/lib/store/post/store"
import { FetchPostResponseWrapper, number_to_post_type } from "@/lib/store/post/types"
import { logout_user } from "@/lib/store/user/actions"
import { cookies } from "next/headers"



export default async function fetchPost(post_id: string): Promise<FetchPostResponseWrapper> {
    let cookieStore = await cookies()
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/post-show/${post_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
        })
        const post = await response.json()
        console.log("got post", post)
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return {
                status: "failed",
                message: "Post get failed",
                data: null
            }
        }
        // // console.log("Response ------------->", res)
        if (!response.ok) {
            return {
                status: "failed",
                message: "Post get failed",
                data: null
            }
        }

        return {
            status: "success",
            message: "Post get successfully",
            data: {
                ...post.data,
                type: number_to_post_type(post.data.type),
                recipient: post.data.recipient ? {
                    ...post.data.recipient,
                    start_time: post.data.recipient.start_time ? JSON.parse(post.data.recipient.start_time) : INITIAL_RECIPIENT.start_time,
                    end_time: post.data.recipient.end_time ? JSON.parse(post.data.recipient.end_time) : INITIAL_RECIPIENT.end_time
                } : INITIAL_RECIPIENT,
                sender: post.data.sender ? {
                    ...post.data.sender,
                    start_time: post.data.sender.start_time ? JSON.parse(post.data.sender.start_time) : INITIAL_SENDER.start_time,
                    end_time: post.data.sender.end_time ? JSON.parse(post.data.sender.end_time) : INITIAL_SENDER.end_time
                } : INITIAL_SENDER,
                additional_service_items: initialPost.additional_service_items.map((item) => {
                    const incomingItem = post.data.additional_service_items.find((i: any) => i.additional_service_id === item.additional_service_id);
                    if (incomingItem) {
                        return {
                            ...item,
                            ...incomingItem,
                            name: item.name,

                        };
                    } else {
                        return { ...item, selected: 0 }
                    }

                })
            }
        }
    } catch (err) {
        // console.log("fetch post error", err)
        return {
            status: "failed",
            message: "Post get failed",
            data: null
        }
    }

}

// const mergedItems = initialPost.additional_service_items.map((item) => {
//     const incomingItem = incomingItems.find(i => i.additional_service_id === item.additional_service_id);
//     if (incomingItem) {
//       return {
//         ...item,
//         ...incomingItem,
//         name: item.name // retain the name from the initial item
//       };
//     }
//     return item;
//   });
