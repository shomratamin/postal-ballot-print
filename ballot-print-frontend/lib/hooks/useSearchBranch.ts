import { useQuery } from "@tanstack/react-query"
import { SearchBranchQuery, SearchBranchResponse } from "../store/common/types";

const searchBranchInfo = async (token: string, query: SearchBranchQuery): Promise<SearchBranchResponse | null> => {

    try {
        // console.log("searchBranchInfo called with query:", query);
        let url = `${process.env.NEXT_PUBLIC_DMS_API_URL}/thikana/branch-info/search/?branch_query=${query.branch_query}&per_page=${query.per_page}&page=${query.page}`;

        if (query.status) {
            url += `&status=${query.status}`;
        }

        const response = await fetch(
            url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
        )
        // console.log("response ---->", response)
        const res_data = await response.json();
        let data: SearchBranchResponse = res_data;
        return data;
    } catch (error: any) {
        console.log("error", error.response.data.message)
        return null
    }
}

export const useSearchBranch = (token: string, searchQuery: SearchBranchQuery) => {
    return useQuery(
        {
            queryKey: ["search_branch_info", searchQuery.page, searchQuery.per_page, searchQuery.branch_query, searchQuery.status],
            queryFn: () => searchBranchInfo(token, searchQuery)
        }
    )
}