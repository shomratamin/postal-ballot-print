import { cookies } from "next/headers"

export default async function fetchZones() {
    let cookieStore = await cookies()
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service/zones`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${cookieStore.get("access")?.value}`,
            Accept: "application/json",
        },
    })
    if (!response.ok) {
        throw new Error("Failed to list zones.")
    }
    const zones = await response.json()
    // // console.log("zones", zones)
    return zones.data
}