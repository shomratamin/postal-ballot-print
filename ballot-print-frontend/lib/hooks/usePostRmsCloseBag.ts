import { useMutation } from "@tanstack/react-query";

interface CloseBagRequest {
  token: string;
  bagId: string;
}

interface ApiResponse {
  status: string;
  message?: string;
}

const closeBag = async ({token, bagId}: CloseBagRequest): Promise<ApiResponse> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/close-bag/`);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bag_id: bagId,
    }),
  });

  if (!response.ok) {
    console.error("API Error:", response.status, response.statusText);
    const errorText = await response.text();
    console.error("Error response body:", errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Close Bag Response:", data);
  return data;
};

export const usePostRmsCloseBag = () => {
  return useMutation({  mutationFn: closeBag });
};
