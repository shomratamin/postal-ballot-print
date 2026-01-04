"use server"
import { ServiceMenu, UserMenuResponse } from "@/lib/store/common/types"
import { logout_user } from "@/lib/store/user/actions"
import { cookies } from "next/headers"


export default async function fetchPermissionMenu(): Promise<UserMenuResponse> {
    try {
        // console.log("fetching permission menus", permissions)
        const cookieStore = await cookies()
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/user/get-user-menus/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
        })

        const permission_menus = await response.json()
        console.log("got permission_menus", permission_menus)
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return {
                status: "error",
                message: "Unauthorized",
                data: []
            }
        }
        if (!response.ok) {
            return {
                status: "error",
                message: permission_menus.error || "Failed to fetch permission menus",
                data: []
            }
        }

        return permission_menus
    } catch (err) {
        console.log("fetch post error", err)
        return {
            status: "error",
            message: "Failed to fetch permission menus",
            data: []
        }
    }

}