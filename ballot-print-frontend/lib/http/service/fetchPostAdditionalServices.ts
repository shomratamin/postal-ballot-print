export default async function fetchPostAdditionalServices() {

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/service/postadditional`, {
        method: 'GET',
    }
    )
    if (!response.ok) {
        throw new Error("Failed to list additional services.")
    }
    const additional_services = await response.json()

    return additional_services
}
