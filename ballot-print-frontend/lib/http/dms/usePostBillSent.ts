import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

export type MarkBillSentParams = {
  bill_id: number | string;
};

export type MarkBillSentData = {
  bill_id: number;
  bill_uuid: string;
  is_sent: boolean;
  sent_at: string;
  updated_at: string;
};


export type MarkBillSentResponse =
  | { status: "success"; message: string; data: MarkBillSentData }
  | { status: "failed"; message: string; data: null };


const sendDebitBill = async ({
  bill_id,
}: MarkBillSentParams): Promise<MarkBillSentResponse> => {
  const token = Cookies.get("access");

  if (!token) {
    return {
      status: "failed",
      message: "Access token not found.",
      data: null,
    };
  }

  // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/mark-bill-sent`;
  let url = `https://accounting.ekdak.com/api/v1/mark-bill-sent`;

  try {
    const res = await fetch(
      url,
      {
        method: "POST",
        cache: "no-cache",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bill_id }),
      }
    );

    const json_data = await res.json();

    console.log("res from mark bill sent", json_data);



    if (!res.ok || json_data?.status !== "success") {
      return {
        status: "failed",
        message: json_data?.message || "Mark bill failed",
        data: null,
      };
    }


    return {
      status: "success",
      message: json_data?.message ?? "Bill marked as sent successfully",

      data: json_data?.data,
    };
  } catch (error) {
    console.error("🚨 Network error:", error);
    return {
      status: "failed",
      message: "Network error occurred",
      data: null,
    };
  }
};



export const useMarkBillSent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendDebitBill,
  });
};
