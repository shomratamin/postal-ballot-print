import { useMutation, useQuery } from "@tanstack/react-query"
import { verify_jwt } from "@/lib/utils/jwtVerify";
import { UserLoginData, UserLoginResponse } from "../store/user/types";
import { VerifiedUser } from "../utils/verifyCookie";


let empty_login_response: UserLoginResponse = {
    status: "failed",
    sso_access_token: "",
    sso_refresh_token: "",
    branch_code: "",
    rms_code: "",
    user_group: "",
    user: {
        id: "",
        uuid: "",
        username: "",
        email: "",
        email_verified: false,
        phone: "",
        phone_verified: false,
        permissions: [],
        authenticated: false,
        created_at: "",
        updated_at: "",
        email_verified_at: "",
        user_type: 0,
    }
}


const loginUser = async (user: UserLoginData): Promise<UserLoginResponse> => {
    console.log("got user", user)
    let decoded_user: VerifiedUser = {
        username: "",
        legal_name: "",
        uuid: "",
        token_type: "",
        exp: 0,
        iat: 0,
        jti: "",
        phone: "",
        phone_verified: false,
        permissions: []
    }

    console.log("url", `/user/rms-user-land/`)

    try {
        const response = await fetch(
            `http://192.168.1.18:8003/user/rms-user-land/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        })

        // const setCookieHeader = response.headers['set-cookie'];
        // console.log("Set-Cookie Header---->", setCookieHeader);

        console.log("response loginUser---->", response)
        if (response.status === 401) {
            console.log("Unauthorized access")
            return empty_login_response
        }
        let response_data: UserLoginResponse = await response.json();
        console.log("response loginUser data---->", response_data)
        return response_data
        // console.log("response loginUser type---->", response.data.type)


        // try {

        //     let decoded_user_response = await verify_jwt(response.data.access)
        //     console.log("decoded_user_response ---->", response)
        //     if (decoded_user_response) {
        //         decoded_user = decoded_user_response
        //     }

        //     console.log("decoded user sso frontend", decoded_user)
        //     for (let i = 0; i < decoded_user.permissions.length; i++) {
        //         console.log("permission", decoded_user.permissions[i])
        //         let splited_permission = decoded_user.permissions[i].split(".")
        //         if (splited_permission.length == 3) {
        //             decoded_user.permissions_map[splited_permission[0]] = {
        //                 role: splited_permission[1],
        //                 permission: splited_permission[2]
        //             }
        //         }

        //     }
        // } catch (err: any) {
        //     console.log("error decoding", err)
        // }



    } catch (error: any) {
        console.log("error", error)
        console.log("error - message", error.response.data.message)

        return empty_login_response
    }
}

export const useUserLogin = () => {
    return useMutation({ mutationFn: loginUser })
}