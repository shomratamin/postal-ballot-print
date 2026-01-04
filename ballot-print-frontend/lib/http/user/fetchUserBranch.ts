"use server"
import { Branch } from "@/lib/store/common/types"
import { logout_user } from "@/lib/store/user/actions"
import { cookies } from "next/headers"

// curl --location 'http://localhost:8002/notification/notifications/' \
// --header 'Authorization: Bearer eyJhbGc...'

export default async function fetchUserBranch(branch_code: string): Promise<Branch | null> {
    try {
        console.log("fetching branch", branch_code)
        const cookieStore = await cookies()
        const response = await fetch(`${process.env.NEXT_PUBLIC_DMS_INTERNAL_API_URL}/thikana/pocode/branch-by-code/?code=${branch_code}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
        })

        const branch = await response.json()
        console.log("got branch", branch)
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return null
        }
        // // console.log("Response ------------->", res)
        if (!response.ok) {
            return null
        }

        return branch
    } catch (err) {
        // console.log("fetch post error", err)
        return null
    }

}
