import { PostOffice } from "./../../store/address/types";

export default async function fetchPostOffices(): Promise<PostOffice[] | []> {
    const response = await fetch(
        "https://ekdak.com/thikana/pocode/police-stations",
        {
            method: "GET",
            headers: {
                Authorization: `Token 1c4dc27192141d9c2e674b52e3bf8ae0d0afc3bd`,
                Accept: "application/json",
            },
        }
    );

    // // console.log("fetchPostOffices", response);
    const postOffices = await response.json();
    if (response.status == 401) {
        return [];
    }
    // // console.log("Response ----->", postOffices)
    if (!response.ok) {
        return [];
    }

    return postOffices.data;
}
