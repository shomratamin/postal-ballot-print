"use server"
import { createPostDB } from "@/lib/http/post/createPost"
import { AdditionalServiceItem, AdditionalServiceItemStoreRequest, Post, PostStoreRequest, PostUpdateRequest } from "./types"
import { initialPost } from "./store"
import { createAdditionalServiceItemsDB } from "@/lib/http/post/createAdditionalServiceItem"
import fetchPost from "@/lib/http/post/fetchPost"
import { updatePostDB } from "@/lib/http/post/updatePost"
import { Person, PersonType, PostUpdatePersonRequest } from "../person/types"
import { updatePostPersonDB } from "@/lib/http/post/updatePostPerson"
import fetchPostDms from "@/lib/http/post/fetchPostDms"

export const create_new_post = async (post: PostStoreRequest, additional_service_items: AdditionalServiceItem[]): Promise<number> => {
    console.log("additional_service_items update", additional_service_items.length)
    // Create a new post in DB
    const post_res = await createPostDB(post)
    // console.log("created new post", post_res)
    if (post_res.status == "success" && post_res.data) {
        let transformed_additional_service_items: AdditionalServiceItemStoreRequest[] = []


        additional_service_items.map(item => {

            // check selected

            // // console.log("selected", item, item.selected == true)
            if (item.selected == true || +item.selected) {
                transformed_additional_service_items.push({
                    post_id: post_res.data?.id || 0,
                    additional_service_id: item.additional_service_id,
                    cost: Number(item.cost),
                    value: `${item.value}`,
                    selectable: +item.selectable,
                    selected: +item.selected
                })
            }


        })

        const add_service_items_res = await createAdditionalServiceItemsDB(transformed_additional_service_items)
        console.log("created post add services", transformed_additional_service_items)
        console.log("add_service_items_res", add_service_items_res)

        let add_ser_items: AdditionalServiceItem[] = []
        add_service_items_res.forEach(item => {
            let new_ser_item: AdditionalServiceItem = {
                id: item.id,
                post_id: item.post_id,
                additional_service_id: item.additional_service_id,
                cost: `${item.cost}`,
                value: `${item.value}`,
                name: "",
                is_delete: 0,
                status_active: 1,
                selectable: Boolean(item.selectable),
                selected: Boolean(item.selected),
                created_at: item.created_at,
                updated_at: item.updated_at
            }
            add_ser_items.push(new_ser_item)
        })



        post_res.data.additional_service_items = add_ser_items

        return post_res.data.id
    } else {
        return 0
    }
}

export const update_post = async (post: PostUpdateRequest, additional_service_items: AdditionalServiceItem[]): Promise<Post | null> => {
    console.log("additional_service_items update", additional_service_items.length)
    // Create a post in DB
    const post_res = await updatePostDB(post)

    // // console.log("updated post", post_res)
    let post_id = post_res.data ? post_res.data.id : 0
    if (post_res.status == "success" && post_res.data) {
        let transformed_additional_service_items: AdditionalServiceItemStoreRequest[] = []

        additional_service_items.map(item => {
            if (item.selected == true || +item.selected) {
                transformed_additional_service_items.push({
                    id: item.id,
                    post_id: post_id,
                    additional_service_id: item.additional_service_id,
                    cost: Number(item.cost),
                    value: `${item.value}`,
                    selectable: +item.selectable,
                    selected: +item.selected,
                })
            }



        })
        if (transformed_additional_service_items.length > 0) {

            const add_service_items_res = await createAdditionalServiceItemsDB(transformed_additional_service_items)
            let add_ser_items: AdditionalServiceItem[] = []
            add_service_items_res.forEach(item => {
                let new_ser_item: AdditionalServiceItem = {
                    id: item.id,
                    post_id: item.post_id,
                    additional_service_id: item.additional_service_id,
                    cost: `${item.cost}`,
                    value: `${item.value}`,
                    name: "",
                    is_delete: 0,
                    status_active: 1,
                    selectable: Boolean(item.selectable),
                    selected: Boolean(item.selected),
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }
                add_ser_items.push(new_ser_item)
            })



            post_res.data.additional_service_items = add_ser_items

            return post_res.data
        } else {
            return post_res.data
        }
        // console.log("created post add services")
        // // console.log("add_service_items_res", add_service_items_res)


    } else if (post_res.status == "failed") {
        // console.log("failed in update_post", post_res)
        return null
    } else {
        // console.log("failed in update_post", post_res)
        return null
    }



}


export const updatePostPerson = async (person: Person, post: Post): Promise<Person> => {
    let add_person_res = null
    if (person.person_type == PersonType["RECIPIENT"]) {
        let postUpdatePersonPayload: PostUpdatePersonRequest = {
            post_id: post.id,
            step: post.step,
            recipient_id: person.id,
        }
        add_person_res = await updatePostPersonDB(postUpdatePersonPayload)
    } else if (person.person_type == PersonType["SENDER"]) {
        let postUpdatePersonPayload: PostUpdatePersonRequest = {
            post_id: post.id,
            step: post.step,
            sender_id: person.id,
        }
        add_person_res = await updatePostPersonDB(postUpdatePersonPayload)
    }
    console.log("created person")
    console.log("add_person_res", add_person_res)
    return person
}




export const get_post = async (post_id: string): Promise<Post> => {
    if (!post_id) return initialPost

    const post_fetch_result = await fetchPostDms(post_id)
    // console.log("fetched post", post_fetch_result)
    // console.log("transformed additional items", post_fetch_result.data?.additional_service_items)

    if (post_fetch_result.status == "success" && post_fetch_result.data) {
        return post_fetch_result.data
    } else if (post_fetch_result.status == "failed") {
        return initialPost
    } else {
        return initialPost
    }


}


