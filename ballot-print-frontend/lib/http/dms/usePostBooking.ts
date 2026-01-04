"use server"
import { cookies } from "next/headers"

const token = "";
export default async function createDmsBooking(formData: FormData): Promise<any> {
    let cookieStore = await cookies()
    console.log("createDmsBooking==>>", formData);
    try {
        let access_token = cookieStore.get("access")?.value || ""
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/book/article/`, {
            cache: "no-cache",
            method: 'POST',
            headers: {
                // 'Authorization': `Bearer ${access_token}`,
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })

        const result_post = await response.json()
        console.log("got post create response -> ", result_post)
        if (response.status == 401) {
            // unauthorized or token expired
            // await logout_user()
            return {
                status: "failed",
                message: "Unauthorized.",
                data: null
            }
        }
        if (!response.ok) {
            // console.log("response create post", response)
            return {
                status: "failed",
                message: result_post.message,
                data: null
            }
        }

        const bookingResponse = result_post
        return {
            status: "success",
            message: "Post created successfully",
            data: bookingResponse
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