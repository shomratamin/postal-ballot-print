"use server"
import { Person, PersonListResponseWrapper, number_to_address_type, number_to_person_type } from "@/lib/store/person/types"
import { logout_user } from "@/lib/store/user/actions"
import { cookies } from "next/headers"


export default async function fetchPersonsDB(): Promise<PersonListResponseWrapper> {
    let cookieStore = await cookies()
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/persons-list/?per_page=100`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
        })
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()

            return {
                data: null,
                status: "failed",
                message: "Persons fetched failed because of Unauthorized Access"
            }
        }

        // // console.log("Response ------------->", response)
        if (!response.ok) {
            return {
                data: null,
                status: "failed",
                message: "Persons fetched failed because of server error"
            }
        }
        const persons = await response.json()
        return {
            data: persons.data.map((person: any) => {
                return {
                    ...person, person_type: number_to_person_type(person.person_type), address_type: number_to_address_type(Number(person.address_type))
                }
            }),
            status: "success",
            message: "Persons fetched successfully"
        }
    } catch (err) {
        // console.log("error in fetch persons", err)
        return {
            data: null,
            status: "failed",
            message: "Persons fetched failed"
        }
    }

}
