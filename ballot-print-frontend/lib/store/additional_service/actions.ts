"use server"

import { AdditionalServiceState, PostAdditionalService } from "./types"
import fetchPostAdditionalServices from "@/lib/http/service/fetchPostAdditionalServices"



export const get_additional_services = async (): Promise<AdditionalServiceState> => {
    // get service from db

    const add_services_res = await fetchPostAdditionalServices()
    const add_services = add_services_res.data
    // // console.log("services from backend", add_services)

    const newAddServiceState: AdditionalServiceState = {};
    add_services.forEach((service: PostAdditionalService) => {
        newAddServiceState[service.id.toString()] = service;
    });
    // console.log("newAddServiceState transformed backend", newAddServiceState)
    return newAddServiceState
}

