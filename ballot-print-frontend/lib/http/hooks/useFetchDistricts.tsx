import { District } from "@/lib/store/address/types";
import { MaterialSelectItem } from "@/src/components/common/MaterialSelect";
import { useQuery } from "@tanstack/react-query";

interface ErrorResponse {
  message: string;
}


export const initialDistrictOptions: MaterialSelectItem[] = [{
  id: 0,
  value: '',
  name: 'Select District',
  bn_name: 'জেলা নির্বাচন করুন',
  en_name: 'Select District',
  code: '',
}];

const getDistrictList = async (token: string): Promise<MaterialSelectItem[]> => {

  try {
    let url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/thikana/pocode/districts/`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    // console.log("districts response data --->", data);
    const districtsOptions: MaterialSelectItem[] = data.data.map((district: District) => ({
      id: district.id,
      value: district.slug,
      name: district.en_name,
      bn_name: district.bn_name,
      en_name: district.en_name,
      code: '',
    }));
    // console.log("districtsOptions", districtsOptions);

    return districtsOptions

  }
  catch (error: any) {
    // console.log("error", error.message);
    // Handle error as needed
    const errorResponse: ErrorResponse = {
      message: error.message,
    };
    return initialDistrictOptions;
  }

};

export const useDistricts = (keyword: string, token: string) => {
  return useQuery({
    queryKey: ["districts", keyword],
    queryFn: () => getDistrictList(token),
  });
};