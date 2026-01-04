import { PostServiceInput } from "@/lib/store/service/types"


export default async function fetchPostServices(): Promise<PostServiceInput[] | null> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/service/postService-list`, {
            method: 'GET',
        })
        const services = await response.json()
        // console.log("services ---------->", services)
        if (!response.ok) {
            return null
        }


        return services.data
    }
    catch (error) {
        console.error("Failed to list services.", error)
        return null
    }

}
