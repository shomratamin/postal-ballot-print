"use server"
import { INITIAL_RECIPIENT } from "@/lib/store/person/store";
import { Person, PersonStoreRequest, address_type_to_number, number_to_person_type, person_type_to_number } from "@/lib/store/person/types";
import { logout_user } from "@/lib/store/user/actions";
import { cookies } from "next/headers";



export default async function updatePerson(person: PersonStoreRequest): Promise<Person | null> {
    let cookieStore = await cookies()
    console.log("got updatePerson", person)
    const formData = new FormData();
    if (person.name) formData.append('name', `${person.name}`);
    if (person.title) formData.append('title', `${person.title}`);
    if (person.email) formData.append('email', `${person.email}`);

    if (person.division) formData.append('division', person.division);
    if (person.division_id) formData.append('division_id', `${person.division_id}`);

    if (person.district) formData.append('district', person.district);
    if (person.district_id) formData.append('district_id', `${person.district_id}`);

    if (person.police_station) formData.append('police_station', person.police_station);
    if (person.police_station_id) formData.append('police_station_id', `${person.police_station_id}`);

    if (person.post_office) formData.append('post_office', person.post_office);
    if (person.post_office_id) formData.append('post_office_id', `${person.post_office_id}`);

    if (person.country) formData.append('country', person.country);
    if (person.country_id) formData.append('country_id', `${person.country_id}`);

    if (person.zone) formData.append('zone', person.zone);
    if (person.zone_id) formData.append('zone_id', `${person.zone_id}`);

    // if (person.user_id) formData.append('user_id', `${person.user_id}`);

    if (person.address) formData.append('address', `${person.address}`);
    if (person.address_type) formData.append('address_type', `${address_type_to_number(person.address_type)}`);

    // if (person.start_time) formData.append('start_time', JSON.stringify(person.start_time));
    // if (person.end_time) formData.append('end_time', JSON.stringify(person.end_time));
    if (person.phone) formData.append('phone', `${person.phone}`);
    if (person.person_type) formData.append('person_type', `${person_type_to_number(person.person_type)}`);


    console.log("url", `/api/bd-post/persons-update/${person.id}`, formData)

    try {

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/persons-update/${person.id}`, {
            cache: "no-cache",
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cookieStore.get("access")?.value}`,
                'Accept': 'application/json'
            },
            body: formData
        })
        const result = await response.json()

        console.log("got person update response -> ", result)

        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return null
        }
        if (!response.ok) {
            // console.log("response update person", response)
            return null
        }




        let personStoreResponse: Person = {
            id: result.data.id,
            name: result.data.name,
            title: result.data.title,
            email: result.data.email,

            division: result.data.division,
            division_id: result.data.division_id,

            district: result.data.district,
            district_id: result.data.district_id,

            police_station: result.data.police_station,
            police_station_id: result.data.police_station_id,

            post_office: result.data.post_office,
            post_office_id: result.data.post_office_id,

            country: result.data.country,
            country_id: result.data.country_id,

            zone: result.data.zone,
            zone_id: result.data.zone_id,

            address: result.data.address,
            user_id: result.data.user_id,

            start_time: result.data.start_time && result.data.start_time.length ? JSON.parse(result.data.start_time) : INITIAL_RECIPIENT.start_time,
            end_time: result.data.end_time && result.data.end_time.length ? JSON.parse(result.data.end_time) : INITIAL_RECIPIENT.end_time,
            phone: result.data.phone,

            person_type: number_to_person_type(Number(result.data.person_type)),
            created_at: result.data.created_at,
            updated_at: result.data.updated_at,
        }
        return personStoreResponse
    } catch (error: any) {
        console.log("error", error)
        // console.log("error - message", error.response.data.message)
        return null
    }



}
