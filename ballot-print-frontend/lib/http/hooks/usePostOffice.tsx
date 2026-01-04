import { PostOffice } from "@/lib/store/address/types";
import { MaterialSelectItem } from "@/src/components/common/MaterialSelect";
import { useQuery } from "@tanstack/react-query";

interface ErrorResponse {
  message: string;
}

export const initialPostOfficeOptions: MaterialSelectItem[] = [{
  id: 0,
  value: '',
  name: 'Select Post Office',
  bn_name: 'পোস্ট অফিস নির্বাচন করুন',
  en_name: 'Select Post Office',
  code: '',
}];

const getPostOfficeList = async (id: number, token: string): Promise<MaterialSelectItem[] | []> => {

  try {
    let url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/thikana/pocode/post-offices?t=${id}`;
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
    // // console.log("response post-office Data ---->", data);
    if (data.length === 0) {
      return initialPostOfficeOptions;
    }

    const postOfficeOptions: MaterialSelectItem[] = data.data.map((post_office: PostOffice) => ({
      id: post_office.id,
      value: post_office.slug,
      name: post_office.en_name,
      bn_name: post_office.bn_name,
      en_name: post_office.en_name,
      code: '',
    }));

    return postOfficeOptions;


  }
  catch (error: any) {
    // console.log("error", error.message);
    const errorResponse: ErrorResponse = {
      message: error.message,
    };
    return initialPostOfficeOptions;
  }
};


export const usePostOffice = (post_Office_Id: number, keyword: string, token: string) => {

  return useQuery({
    queryKey: ["post_Office", post_Office_Id, keyword],
    queryFn: () => getPostOfficeList(post_Office_Id, token),
  });
};
