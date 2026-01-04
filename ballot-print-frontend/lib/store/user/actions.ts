"use server"

import { User, UserForgetPassword, UserForgetPasswordResponse, UserLoginData, UserLoginResponse, UserRegisterOTPResponse, UserRegisterOtpData, UserSignupResponse, UserVerifyOTPResponse, UserVerifyOtpData, UserVerifyResponse, changePasswordForm } from "./types"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { defaultLanguage, deserialize, initialUserState, serialize } from "./store"
import { redirect } from "next/navigation"
import { Locale } from "@/dictionaries/dictionaty"



export const setPhoneCookies = async (phone: string): Promise<void> => {
    let cookieStore = await cookies()
    cookieStore.set('phone', phone)

}

export async function has_lang_cookie() {
    // console.log("has_lang_cookie", cookies().has("lang"))
    // return cookies().has("lang")
    let cookieStore = await cookies()
    return cookieStore.has('lang')
}
export async function get_lang_cookie(): Promise<Locale> {
    let cookieStore = await cookies()
    if (cookieStore.has("lang")) {
        // console.log("get_lang_cookie", cookies().get("lang")?.value)
        return cookieStore.get("lang")?.value as Locale
    } else {
        // console.log("get_lang_cookie", defaultLanguage)
        return defaultLanguage
    }
}
export async function set_lang_cookie(lang: Locale) {
    // console.log("set_lang_cookie", lang)
    let cookieStore = await cookies()
    return cookieStore.set("lang", lang)
}



export const get_user_state = async () => {
    let cookieStore = await cookies()
    let user_state: User = initialUserState
    const has_token = cookieStore.has('access')
    let token = cookieStore.get("access")

    if (!has_token || !token) {
        // await set_redis_cache(`user`, user_state, 7200)
        return initialUserState
    }

    // console.log("has_access token", has_token)
    // console.log("access token", token)

    // const profile_res = await fetchProfile()
    // console.log("profile res", profile_res)
    // user_state = profile_res.data
    // console.log("profile data from backend", user_state)
    if (!user_state) {
        return initialUserState
    }
    return user_state
}

// export const login_user = async (user_data: UserLoginData): Promise<UserLoginResponse> => {


//     // // console.log("login data", user_data)
//     const response = await loginCustomer(user_data)



//     if (response.status == "failed") {

//         return {
//             status: response.status,
//             token: response.token,
//             message: response.message,
//             data: response.data

//         }
//     } else if (response.status == "success" && response.data) {
//         // console.log("login response", response)

//         const user: User = {
//             id: response.data.id,
//             name: response.data.name,
//             user_type: response.data.user_type,
//             email: response.data.email,
//             email_verified: response.data.email_verified,
//             email_verified_at: response.data.email_verified_at,
//             phone: response.data.phone,
//             phone_verified: response.data.phone_verified,
//             nid_back_page: response.data.nid_back_page,
//             nid_front_page: response.data.nid_front_page,
//             created_at: response.data.created_at,
//             updated_at: response.data.updated_at,
//         }
//         const user_id = await create_user(user)

//         const session_attrs: SessionDB = {
//             userId: user_id,
//             token: response.token,
//             phone: response.data.phone,
//             username: response.data.name || "",
//             authenticated: 1
//         }


//         const session = await createNewSession(session_attrs)
//         // console.log("session", session)

//         cookies().set('token', session.id)
//         return {
//             status: response.status,
//             token: response.token,
//             message: response.message,
//             data: user
//         }
//     } else {
//         return {
//             status: response.status,
//             token: response.token,
//             message: response.message,
//             data: response.data
//         }
//     }


// }

export const logout_user = async () => {
    // DELETE SESSION FROM COOKIES
    let cookieStore = await cookies()
    cookieStore.delete("access")
    cookieStore.delete("refresh")

    redirect('/')
}

export const log_out = async () => {
    let cookieStore = await cookies()
    // DELETE SESSION FROM COOKIES
    cookieStore.delete("access")
    cookieStore.delete("refresh")
}

