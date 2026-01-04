
import { useQuery } from "@tanstack/react-query";
import { number_to_address_type, number_to_person_type, Person, } from "../store/person/types";


const getPersons = async (token: string): Promise<Person[] | []> => {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/persons-list?per_page=100`

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        const persons = await response.json();
        // console.log("persons response --->", persons);

        // console.log("response data --->", response.status);
        if (response.status === 401) {
            return []
        }

        if (persons.data.length === 0) {
            return []
        }
        return persons.data.map((person: any) => {
            return {
                ...person, person_type: number_to_person_type(person.person_type), address_type: number_to_address_type(person.address_type)
            }
        })

    }
    catch (error: any) {
        // console.log("error", error.message);
        // Handle error as needed
        return []
    }

};


export const usePersons = (token: string) => {
    return useQuery({
        queryKey: ["persons"],
        queryFn: () => getPersons(token),
    });
};