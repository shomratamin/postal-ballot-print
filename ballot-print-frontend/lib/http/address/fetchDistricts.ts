import { District } from "./../../store/address/types";

export default async function fetchDistricts(): Promise<District[] | []> {
    try {
        const response = await fetch("https://ekdak.com/thikana/pocode/districts", {
            method: "GET",

            headers: {
                Authorization: `Token 1c4dc27192141d9c2e674b52e3bf8ae0d0afc3bd`,
                Accept: "application/json",
            },
        });
        // // console.log("fetchDistricts",response);
        const districts = await response.json();
        if (response.status == 401) {
            // unauthorized or token expired
            return [];
        }
        // // console.log("Response ------------->", res)
        if (!response.ok) {
            return [];
        }

        return districts.data;
    }
    catch (err: any) {
        // console.log("error fetching districts", err);
        return [];
    }

}
