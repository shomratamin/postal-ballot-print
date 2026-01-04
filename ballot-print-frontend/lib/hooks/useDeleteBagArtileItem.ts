import { useMutation } from "@tanstack/react-query";

interface DeleteBagArticleRequest {
  token: string;
  bagId: string;
  itemId: string;
}

interface ApiResponse {
  status: string;
  message?: string;
}

const deleteBagArticle = async ({token, bagId, itemId}: DeleteBagArticleRequest): Promise<ApiResponse> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/bag/remove-article/`);

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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const useDeleteBagArtileItem = () => {
  return useMutation({ mutationFn: deleteBagArticle });
};
