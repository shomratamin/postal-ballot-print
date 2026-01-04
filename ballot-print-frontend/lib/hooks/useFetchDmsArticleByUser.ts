import { useQuery } from "@tanstack/react-query";
import fetchDmsArticleByUser from "../http/post/fetchDmsArticleByUser";

export const useFetchDmsArticleByUser = (identifier: string) => {
    return useQuery({
        queryKey: ['dms-article-by-user', identifier],
        queryFn: () => fetchDmsArticleByUser(identifier),
        enabled: !!identifier, // Only run query if identifier is provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};