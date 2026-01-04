import { useQuery } from "@tanstack/react-query";
import { number_to_post_type, Post } from "../store/post/types";

interface ErrorResponse {
  message: string;
}


const getPost = async (token: string, post_id: number): Promise<Post | null> => {
  // console.log("getPost called", post_id, token);
  if (!post_id || post_id == 0) {
    return null
  }
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bd-post/post-show/${post_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    // console.log("response getPost data --->", data);
    if (data.length === 0) {
      return null
    }

    const post = data;
    // console.log("post ", post);

    return { ...post.data, type: number_to_post_type(Number(post.data.type)) }

  }
  catch (error: any) {
    // console.log("error", error.message);
    // Handle error as needed
    const errorResponse: ErrorResponse = {
      message: error.message,
    };
    return null
  }

};

export const usePost = (token: string, post_id: number) => {
  return useQuery({
    queryKey: ["post", post_id],
    queryFn: () => getPost(token, post_id),
  });
};