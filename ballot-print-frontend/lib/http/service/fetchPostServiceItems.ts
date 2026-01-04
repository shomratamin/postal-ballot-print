

export default async function fetchPostServiceItems(post_id: number) {

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service/show-by-post-service-id/${post_id}`, {
        method: 'GET',
    })
    if (!response.ok) {
        throw new Error("Failed to list Service Items.")
    }
    const service_items = await response.json()

    return service_items
}
