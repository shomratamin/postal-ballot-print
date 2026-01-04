"use server"
import { FetchPostDmsResponseWrapper } from "@/lib/store/post/types"
import { logout_user } from "@/lib/store/user/actions"
import { cookies } from "next/headers"

export default async function fetchDmsArticleByUser(identifier: string): Promise<FetchPostDmsResponseWrapper> {
    let cookieStore = await cookies()
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/get-dms-article-web-by-user/?identifier=${identifier}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
        })

        console.log("DMS Article fetch response status:", response.status)

        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return {
                status: "failed",
                message: "DMS Article get failed - unauthorized",
                data: null
            }
        }

        if (!response.ok) {
            return {
                status: "failed",
                message: "DMS Article get failed",
                data: null
            }
        }

        const articleData = await response.json()
        console.log("got DMS article", articleData)

        return {
            status: "success",
            message: "DMS Article get successfully",
            data: articleData
        }
    } catch (err) {
        console.log("fetch DMS article error", err)
        return {
            status: "failed",
            message: "DMS Article get failed",
            data: null
        }
    }
}