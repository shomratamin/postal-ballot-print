"use server"
import { Person, PersonListResponseWrapper, PersonStoreRequest, PersonType, PostUpdatePersonRequest } from "./types"
import createPerson from "@/lib/http/person/createPerson"
import fetchPersonsDB from "@/lib/http/person/fetchPersons"
import updatePersonDB from "@/lib/http/person/updatePerson"
import { updatePostPersonDB } from "@/lib/http/post/updatePostPerson"
import { Post } from "../post/types"

export const create_new_person = async (person: PersonStoreRequest): Promise<Person | null> => {
    console.log("creating new person")
    // Create a new person in DB
    const person_res = await createPerson(person)
    // console.log("creating person and adding to store")
    if (person_res.status == "success" && person_res.data != null) {
        return person_res.data
    }
    else {
        // console.log("person creation failed in server, error ->", person_res.message)
        return null
    }
}

// export const add_person_to_persons_redis = async (token: string, session: Session, person: Person) => {
//     const persons_exists = await key_exists(personsKey(session.user_id))

//     if (!persons_exists) {
//         const persons = await fetch_persons_from_db(token)
//         await set_redis_cache(personsKey(session.user_id), persons, 7200)
//     } else {

//         const existing_persons = await get_redis_cache(personsKey(session.user_id))
//         // console.log("existing_persons", existing_persons)
//         existing_persons.push(person)
//         // console.log("existing_persons after push", existing_persons)
//         await set_redis_cache(personsKey(session.user_id), existing_persons, 7200)
//     }
// }


export const update_person = async (person_store: PersonStoreRequest): Promise<Person | null> => {
    // console.log("updating person")
    // update person in DB
    const person = await updatePersonDB(person_store)


    return person

}

export const update_post_person = async (post: Post, person: Person): Promise<Person> => {
    // console.log("updating person in post")
    let update_person = null
    if (person.person_type == PersonType["RECIPIENT"]) {
        let postUpdatePersonPayload: PostUpdatePersonRequest = {
            post_id: post.id,
            step: post.step,
            recipient_id: person.id,
        }
        update_person = await updatePostPersonDB(postUpdatePersonPayload)
    } else if (person.person_type == PersonType["SENDER"]) {
        let postUpdatePersonPayload: PostUpdatePersonRequest = {
            post_id: post.id,
            step: post.step,
            sender_id: person.id,
        }
        update_person = await updatePostPersonDB(postUpdatePersonPayload)
    }

    return person
}


export const fetch_persons_from_db = async (): Promise<Person[]> => {
    let result = await fetchPersonsDB()
    if (result.status == "success" && result.data) {
        let persons: Person[] = result.data ? result.data : []

        return persons
    } else {
        let persons: Person[] = []
        return persons
    }

}

export const get_persons = async (): Promise<Person[]> => {
    let persons = await fetch_persons_from_db()
    // console.log("persons=====", persons)
    // let redis_persons = await set_redis_cache(personsKey(session.userId), persons, 7200)
    return persons

}

// export const select_person = async (session: Session, person: Person) => {
//     const persons_exists = await key_exists(personsKey(session.user_id))

//     if (!persons_exists) {
//         // persons for this use does not exists. fetch persons from db
//     }


//     const persons = await get_redis_cache(personsKey(session.user_id))
//     const updated_person_selected = persons.map((person_in_loop: Person) => {
//         if (person_in_loop.id == person.id) {
//             return {
//                 ...person,
//                 selected: true
//             }
//         } else {
//             return {
//                 ...person,
//                 selected: false
//             }
//         }
//     })
//     await set_redis_cache(personsKey(session.user_id), updated_person_selected, 7200)

// }



// export const get_person = async (session: Session, person_id: number) => {
//     const persons = await get_redis_cache(personsKey(session.user_id))
//     const person = persons.filter((per: Person) => per.id == person_id)[0]
//     return person
// }


