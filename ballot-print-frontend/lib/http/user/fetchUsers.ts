"use server"
import { cookies } from "next/headers"


export default async function fetchUsers() {
    let cookieStore = await cookies()
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/user`, {
        method: 'GET',

        headers: {
            'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
            'Accept': 'application/json'
        },
    })
    if (!response.ok) {
        throw new Error("Failed to list Users.")
    }
    const users = await response.json()

    return users
}
