import { useMutation } from "@tanstack/react-query";
import { LabelGenerateApiResponse, LabelGenerateRequest } from "../store/common/types";


export const emptyApiResponse: LabelGenerateApiResponse = {
  status: "error",
  message: "Failed to generate the label.",
  print_response: null
}

const generateLabel = async ({ token, label, printer_id }: LabelGenerateRequest): Promise<LabelGenerateApiResponse> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/dms/v1/bulk-label-print/`);
  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: label,
        printer_id: printer_id
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
        message: `Failed to generate the label: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("Generate Label Response:", data);
    return data;
  } catch (error) {
    console.error("Error generating label:", error);
    return {
      ...emptyApiResponse,
      status: "error",
      message: `Failed to generate the label`,
    };
  }

};

export const useLabelGenerate = () => {
  return useMutation({ mutationFn: generateLabel });
};
