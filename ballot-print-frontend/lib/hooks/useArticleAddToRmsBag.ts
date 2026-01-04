import { useMutation } from "@tanstack/react-query";
import { createBagArticleRequest } from "../store/common/types";

const createRmsBagArticle = async (vars: { token: string; articleAddRequest: createBagArticleRequest }) => {
  const { token, articleAddRequest } = vars;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/bag/add-article/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(articleAddRequest),
    }
  );

  const data = await response.json();
  console.log("Create RMS Bag Article Response:", data);
  return data;
};

export const useArticleAddToRmsBag = () => {
    return useMutation({ mutationFn: createRmsBagArticle })
};
