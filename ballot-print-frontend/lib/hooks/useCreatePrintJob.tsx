import { useMutation } from "@tanstack/react-query";
import { PrintJobRequest, PrintJobResponse } from "../store/common/types";

const createPrintJob = async (printJob: PrintJobRequest): Promise<PrintJobResponse> => {

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EKDAK_API_URL}/print/create-print-job/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${printJob.token}`,
                Accept: "application/json",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(printJob.job)
        });

        console.log("response data --->", response);

        const data = await response.json();
        console.log("response json --->", data);

        let printJobResponse: PrintJobResponse = {
            status: "error",
            message: "Error creating print job",
            job_id: '',
            token: '',
            detail: data?.detail
        }

        if (response.status === 401) {
            return printJobResponse
        }
        if (data.length === 0) {
            return printJobResponse
        }

        printJobResponse.status = data.status
        printJobResponse.message = data.message
        printJobResponse.job_id = data.job_id
        printJobResponse.token = data.token
        printJobResponse.detail = data?.detail

        return printJobResponse

    }
    catch (error: any) {
        // console.log("error", error.message);
        // Handle error as needed
        let printJobResponse: PrintJobResponse = {
            status: "error",
            message: "Error creating print job",
            job_id: '',
            token: '',
            detail: "Error creating print job",
        }

        return printJobResponse
    }

};


export const useCreatePrintJob = () => {
    return useMutation({ mutationFn: createPrintJob })
};

