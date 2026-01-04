"use server"

import { PostService, PostServiceInput, ServiceItem, ServiceItemMap, ServiceState } from "./types"
import fetchPostServices from "@/lib/http/service/fetchPostServices"
import { ServiceLocale } from "@/dictionaries/types"





export const get_services = async (): Promise<ServiceState | null> => {
    // get service from db
    // console.log("getting services_res backend")
    const services_res = await fetchPostServices()
    // console.log("services_res backend", services_res)
    if (!services_res) {
        return null
    }
    const services = services_res
    // console.log("services from backend", services)
    const serviceState: ServiceState = services.reduce((acc: ServiceState, service: PostServiceInput) => {
        // Convert the current service's items array into a ServiceItemMap
        const itemsMap: ServiceItemMap = service.items.reduce((itemsAcc: ServiceItemMap, item: ServiceItem) => {
            // Use itemsAcc to accumulate the items map, not items
            itemsAcc[item.id.toString()] = item;
            return itemsAcc;
        }, {});

        // Construct the PostService object including its items map and add it to the serviceState
        acc[service.id.toString()] = {
            ...service, // Spread operator to copy all properties from the service
            selectable: true,
            selected: false,
            temp_cost: 0,
            items: itemsMap // Override the items array with the itemsMap
        };

        return acc;
    }, {});
    // console.log("services state backend", serviceState)
    return serviceState
}

