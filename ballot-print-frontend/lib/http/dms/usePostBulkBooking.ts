import { useMutation } from "@tanstack/react-query";

export interface ReceiveBulkRequest {
  token: string;
  user_id: string;
}

export interface ReceiveBulkApiResponse {
  status: "success" | "failed" | "error";
  status_code?: number;
  message: string;
  total_items_fetched?: number;
  successfully_booked?: number;
  already_existing?: number;
  data?: any;
}

const emptyApiResponse: ReceiveBulkApiResponse = {
  status: "error",
  message: "",
};

const parseJSONSafe = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const PostBulkBooking = async ({ token, user_id }: ReceiveBulkRequest): Promise<ReceiveBulkApiResponse> => {
  
    const url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/api/corporate-bulk-book-article/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id }),
    });

    // Try to parse JSON regardless of status
    const parsed = await parseJSONSafe(response);

    // If server returned the expected shape, return it as-is
    if (parsed && typeof parsed === "object" && parsed.message) {
      return {
        status: parsed.status as ReceiveBulkApiResponse["status"],
        status_code: Number(parsed.status_code ?? response.status),
        message: String(parsed.message),
        total_items_fetched: parsed.total_items_fetched,
        successfully_booked: parsed.successfully_booked,
        already_existing: parsed.already_existing,
        data: parsed.data,
      };
    }

    // Fallbacks if server didn't return JSON in expected shape
    if (!response.ok) {
      return {
        ...emptyApiResponse,
        status: "failed",
        status_code: response.status,
        message: `Request failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      status: "success",
      status_code: response.status || 200,
      message: "Success",
    };
  } catch {
    return {
      ...emptyApiResponse,
      status: "error",
      status_code: 0,
      message: "Network error.",
    };
  }
};

/** Hook: mutate({ token, user_id }) returns the exact server shape */
export const usePostBulkBooking = () =>
  useMutation<ReceiveBulkApiResponse, Error, ReceiveBulkRequest>({
    mutationFn: PostBulkBooking,
  });
