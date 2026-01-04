"use server"
import { cookies } from "next/headers";


export default async function fetchPosts() {
    let cookieStore = await cookies()
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/post-list`, {
        method: 'GET',

        headers: {
            'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
            'Accept': 'application/json'
        },
    })
    if (!response.ok) {
        throw new Error("Failed to list posts.")
    }
    const posts = await response.json();

    return posts;
}
