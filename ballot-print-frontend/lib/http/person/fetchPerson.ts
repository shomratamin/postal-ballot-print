"use server"
import { cookies } from "next/headers"


export default async function fetchPerson(person_id: string) {
    let cookieStore = await cookies()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/persons-show/${person_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
            'Accept': 'application/json'
        },
    })
    if (response.status == 401) {
        return "unauthorized"
    }
    // console.log("Response ------------->", response)
    if (!response.ok) {
        throw new Error("Failed to get person.")
    }
    const person = await response.json()
    return person
}
