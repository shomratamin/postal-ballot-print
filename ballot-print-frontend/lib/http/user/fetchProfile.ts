"use server"
import { cookies } from "next/headers"


export default async function fetchProfile() {
    let cookieStore = await cookies()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
            'Accept': 'application/json'
        },
    })

    if (!response.ok) {
        return {
            status: response.status || "failed",
            statusText: response.statusText || "error",
            data: null
        }
    }

    if (response.status == 401) {
        return {
            status: response.status || "failed",
            statusText: response.statusText || "error",
            data: null
        }
    }

    try {
        const profile = await response.json()
        return {
            status: response.status || "failed",
            statusText: response.statusText || "error",
            data: profile
        }
    } catch (e) {
        // console.log("json parse error.", e)
        return {
            status: response.status || "failed",
            statusText: response.statusText || "error",
            data: null
        }
    }

}
