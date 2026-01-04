
import { INITIAL_RECIPIENT, INITIAL_SENDER } from "@/lib/store/person/store"
import { initialPost } from "@/lib/store/post/store"
import { FetchPostDMSResponseWrapper, number_to_post_type, PostStatus } from "@/lib/store/post/types"
import { logout_user } from "@/lib/store/user/actions"
import { useQuery } from "@tanstack/react-query"

const getArticleData = async (token: string, barcode: string): Promise<FetchPostDMSResponseWrapper> => {
    if (!barcode || barcode.length === 0) {
        return {
            status: "failed",
            message: "Article get failed",
            data: null
        }
    }
    let url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/get-dms-article-web-by-user/?identifier=${barcode}`
    console.log("useFetchArticleFromDMS Fetching DMS article from URL:", url)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
        })
        const post = await response.json()
        console.log("got article data from dms", post)
        if (response.status == 401) {
            // unauthorized or token expired
            await logout_user()
            return {
                status: "failed",
                message: "Article get failed",
                data: null
            }
        }
        // // console.log("Response ------------->", res)
        if (!response.ok) {
            return {
                status: "failed",
                message: "Article get failed",
                data: null
            }
        }

        // Transform DMS response to Post interface
        const dmsData = post.data;

        // Extract VP amount from additional services
        const vpService = dmsData.additional_services?.find((service: any) => service.additional_service === 'vp');
        const vpAmount = vpService ? parseFloat(vpService.value) : undefined;
        const vpFormNumber = vpService ? vpService.value : undefined;

        // Calculate service cost and additional service cost
        const additionalServiceCost = dmsData.additional_services?.reduce((total: number, service: any) => {
            return total + parseFloat(service.cost || "0");
        }, 0) || 0;

        // Determine post type based on service type or other indicators
        const postType = dmsData.service_type?.name === 'international' ? 2 : 1;

        return {
            status: "success",
            message: "Post get successfully",
            data: {
                id: dmsData.id,
                order_id: undefined,
                step: "completed", // Based on status or booking info
                weight: dmsData.weight,
                length: dmsData.length || undefined,
                width: dmsData.width || undefined,
                height: dmsData.height || undefined,
                created_by: dmsData.booking_info?.[0]?.booked_user_id ? parseInt(dmsData.booking_info[0].booked_user_id) : 1,
                description: dmsData.article_desc || "",
                service_id: dmsData.service_id, // Default or map from service_type.key
                service_item_id: 1, // Default
                service_cost: dmsData.service_charge,
                service_name: dmsData.service_name,
                service_bn_name: dmsData.service_type?.label || dmsData.service_name,
                additional_service_cost: additionalServiceCost,
                total_cost: dmsData.service_charge + additionalServiceCost,
                zone: "SAARC countries", // Default
                country: "Bangladesh", // Default
                zone_id: 1, // Default
                country_id: 1, // Default
                weight_upper: dmsData.weight,
                weight_lower: 0,
                barcode: dmsData.barcode,
                status: dmsData.status as any, // Map to PostStatus enum if needed
                type: number_to_post_type(postType),
                sender: {
                    ...INITIAL_SENDER,
                    id: 1,
                    address: dmsData.sender_address || "",
                    // Parse sender info from sender_address if needed
                },
                recipient: {
                    ...INITIAL_RECIPIENT,
                    id: 2,
                    address: dmsData.receiver_address || "",
                    // Parse recipient info from receiver_address if needed
                },
                additional_service_items: initialPost.additional_service_items.map((item) => {
                    const incomingService = dmsData.additional_services?.find((service: any) =>
                        service.additional_service === item.name ||
                        service.name === item.name
                    );

                    if (incomingService) {
                        return {
                            ...item,
                            cost: incomingService.cost,
                            value: incomingService.value,
                            selected: true,
                            form_number: item.name === 'vp' ? vpFormNumber : undefined
                        };
                    } else {
                        return {
                            ...item,
                            selected: false
                        }
                    }
                }),
                created_at: dmsData.created_at,
                updated_at: dmsData.updated_at,
                vp_amount: vpAmount,
                vp_form_number: vpFormNumber,
                events: dmsData.events
            }
        }
    } catch (err) {
        // console.log("fetch post error", err)
        return {
            status: "failed",
            message: "Post get failed",
            data: null
        }
    }

}
export const useFetchArticleFromDMS = (token: string, barcode: string) => {
    return useQuery({
        queryKey: ["get_article_from_dms", token, barcode],
        queryFn: () => getArticleData(token, barcode),
    });
}
