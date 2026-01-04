import { useMutation } from "@tanstack/react-query";
import { ReceiveBagItemRequest } from "../store/common/types";



interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
}

let emptyApiResponse: ApiResponse = {
  status: "error",
  message: "Failed to receive the bag item.",
  data: null
};

const receiveBagItem = async ({ token, bagId, itemId }: ReceiveBagItemRequest): Promise<ApiResponse> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/receive-bag-item/`);
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
        item_id: itemId
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
        message: `Failed to receive the bag item: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("Receive Bag Item Response:", data);
    return data;
  } catch (error: any) {
    console.error("Error receiving bag item:", error);
    return {
      ...emptyApiResponse,
      status: "error",
      message: `Failed to receive the bag item.`,
    };
  }

};

export const usePostReceiveBagItem = () => {
  return useMutation({ mutationFn: receiveBagItem });
};
