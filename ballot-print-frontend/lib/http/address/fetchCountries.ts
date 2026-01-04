import { Country } from "@/lib/store/address/types"
import { cookies } from "next/headers"


export default async function fetchCountries(): Promise<Country[]> {
    let cookieStore = await cookies()
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/service/countries`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${cookieStore.get("access")?.value}`,
                Accept: "application/json",
            },
        })
        const countries = await response.json()
        // console.log("countries", countries)

        return countries.filter((country: { name: string }) => country.name !== "Bangladesh")
    } catch (err: any) {
        console.log("error fetching countries", err)
        return []
    }
}