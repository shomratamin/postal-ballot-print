"use client";

import { PostDebitBillPayload, PostDebitBillResponse } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";


async function postDebitBill(payload: PostDebitBillPayload): Promise<PostDebitBillResponse> {
  const access = Cookies.get("access") || "";
  let url = `https://accounting.ekdak.com/api/v1/operatorDebitbill/`;
  // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/operatorDebitbill/`;

  const res = await fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      Authorization: `Bearer ${access}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload), // { ledger_ids: [...] }
  });

  const json = (await res.json().catch(() => ({}))) as Partial<PostDebitBillResponse>;

  if (res.status === 401) {
    return { status: "failed", message: "Unauthorized.", data: null };
  }
  if (!res.ok) {
    return {
      status: "failed",
      message: (json as any)?.message || "Post failed",
      data: null,
    };
  }

  // success shape: matches the sample you shared
  return {
    status: "success",
    message: (json as any)?.message ?? "Balance created successfully",
    data: (json as any)?.data ?? null,
  };
}

export function usePostDebitBill() {
  const qc = useQueryClient();

  return useMutation<PostDebitBillResponse, Error, PostDebitBillPayload>({
    mutationFn: postDebitBill,
    onSuccess: (resp) => {
    },
    onError: (err) => {
      // toast.error(err.message);
      console.error("PostDebitBill error:", err);
    },
  });
}
