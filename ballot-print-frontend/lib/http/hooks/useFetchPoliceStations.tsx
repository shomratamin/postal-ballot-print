import { PoliceStation } from "@/lib/store/address/types";
import { MaterialSelectItem } from "@/src/components/common/MaterialSelect";
import { useQuery } from "@tanstack/react-query";

// Define the type for the error object
interface ErrorResponse {
  message: string;
}

export const initialPoliceStationOptions: MaterialSelectItem[] = [{
  id: 0,
  value: '',
  name: 'Select Police Station',
  bn_name: 'পুলিশ স্টেশন নির্বাচন করুন',
  en_name: 'Select Police Station',
  code: '',
}];

const getPoliceStationsList = async (districtId: number, token: string): Promise<MaterialSelectItem[] | []> => {

  try {
    let url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/thikana/pocode/police-stations?d=${districtId}`;
    const response = await fetch(url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    // // console.log("response data ---->", data);
    if (data.length === 0) {
      return initialPoliceStationOptions;
    }
    // // console.log("PoliceStations", PoliceStations);
    // console.log("PoliceStations response data --->", data);
    const policeOptions: MaterialSelectItem[] = data.data.map((police_station: PoliceStation) => ({
      id: police_station.id,
      value: police_station.slug,
      name: police_station.en_name,
      bn_name: police_station.bn_name,
      en_name: police_station.en_name,
      code: '',
    }));
    // console.log("policeOptions", policeOptions);

    return policeOptions


  }
  catch (error: any) {
    // console.log("error", error.message);
    // Handle error as needed
    const errorResponse: ErrorResponse = {
      message: error.message,
    };
    return initialPoliceStationOptions;
  }
};


export const usePoliceStation = (district_id: number, keyword: string, token: string) => {
  return useQuery({
    queryKey: ['policeStations', district_id, keyword],
    queryFn: () => getPoliceStationsList(district_id, token),
  });
};

