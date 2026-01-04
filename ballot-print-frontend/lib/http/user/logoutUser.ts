import { UserLogoutResponse } from "@/lib/store/user/types"

export const logout_from_ekdak = async (token: string): Promise<UserLogoutResponse> => {
    // console.log("loging out from ekdak")
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_EKDAK_BACKEND_API_URL}/sso/logout`, {
            cache: "no-cache",
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        })
        // console.log("raw response", response)
        const data = await response.json()
        // console.log("login resp data", data)

        if (response.ok) {
            // console.log("response login", data)
            return data
        }

        return {
            "status": "failed"
        }
    } catch (err) {
        // console.log("error login user", err)
        return {
            "status": "failed"
        }
    }

}
