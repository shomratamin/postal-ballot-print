import { useQuery } from "@tanstack/react-query"
import { UserInfoData } from "../store/user/types";

const getUserInfo = async (token: string): Promise<UserInfoData | null> => {

    try {
        // console.log("getUserInfo called with query:", query);
        let url = `${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/user/info/`;

        const response = await fetch(
            url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        }
        )

        const res_data = await response.json();
        console.log("user info response ---->", res_data)
        let data: UserInfoData = res_data;
        return data;
    } catch (error: any) {
        console.log("error", error.response.data.message)
        return null
    }
}

export const useUserInfo = (token: string) => {
    return useQuery(
        {
            queryKey: ["user_info"],
            queryFn: () => getUserInfo(token)
        }
    )
}