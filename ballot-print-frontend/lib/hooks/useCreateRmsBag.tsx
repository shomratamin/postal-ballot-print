import { useMutation } from "@tanstack/react-query";
import { createRmsBagRequest, CreateRmsBagResponse } from "../store/common/types";

const createRmsBag = async (vars: { token: string; bookingRequest: createRmsBagRequest }): Promise<CreateRmsBagResponse> => {
  const { token, bookingRequest } = vars;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/bag/create/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingRequest),
    }
  );

  const data: CreateRmsBagResponse = await response.json();
  console.log("Create RMS Bag Response:", data);
  return data;
};

export const useCreateRmsBag = () => {
  return useMutation({ mutationFn: createRmsBag })
};
