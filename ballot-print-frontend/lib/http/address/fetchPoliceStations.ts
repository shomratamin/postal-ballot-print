import { PoliceStation } from "./../../store/address/types";

export default async function fetchPoliceStations(): Promise<PoliceStation[] | []> {
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

    // // console.log("fetchPoliceStations", response);
    const policeStations = await response.json();
    if (response.status == 401) {
        return [];
    }
    // // console.log("Response ----->", policeStations)
    if (!response.ok) {
        return [];
    }

    return policeStations.data;
}
