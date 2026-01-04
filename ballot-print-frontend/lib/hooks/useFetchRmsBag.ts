import { useMutation } from "@tanstack/react-query";
import { FetchRmsBagRequest, FetchRmsBagResponse } from "../store/common/types";

const fetchRmsBag = async (vars: FetchRmsBagRequest): Promise<FetchRmsBagResponse> => {
  const { token, bagId } = vars;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/search-bag/?bag_id=${bagId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  console.log("Fetch RMS Bag Response:", data);
  return data;
};

export const useFetchRmsBag = () => {
  return useMutation({ mutationFn: fetchRmsBag })
};
