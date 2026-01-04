import { useMutation } from "@tanstack/react-query";
import { ReceiveBagApiResponse, ReceiveBagRequest } from "../store/common/types";


export const emptyApiResponse: ReceiveBagApiResponse = {
  status: "error",
  message: "Failed to receive the bag.",
  data: null
}

const receiveBag = async ({ token, bagId, lineId, instructions, receiveType }: ReceiveBagRequest): Promise<ReceiveBagApiResponse> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/receive-bag/`);
  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bag_id: bagId,
        line_id: lineId,
        instructions: instructions || '',
        receive_type: receiveType
      }),
    });

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      // throw new Error(`API Error: ${response.status} ${response.statusText}`);
      return {
        ...emptyApiResponse,
        status: "error",
        message: `Failed to receive the bag: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("Receive Bag Response:", data);
    return data;
  } catch (error) {
    console.error("Error receiving bag:", error);
    return {
      ...emptyApiResponse,
      status: "error",
      message: `Failed to receive the bag.`,
    };
  }

};

export const usePostReceiveBag = () => {
  return useMutation({ mutationFn: receiveBag });
};
