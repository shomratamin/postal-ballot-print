import { useMutation } from "@tanstack/react-query";

const fetchRmsLineInfo  = async ( token: string ) => {
  const url = new URL(`${process.env.NEXT_PUBLIC_DMS_API_URL}/rms/get-line-info`);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            'Content-Type': 'application/json'
        },
    });

  if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Fetch RMS Line Info Response:", data);
  return data;
};

export const useFetchRmsLineInfo = () => {
    return useMutation({ mutationFn: fetchRmsLineInfo  })
};
