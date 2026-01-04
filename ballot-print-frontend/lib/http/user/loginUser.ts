import { UserLoginData, UserLoginResponse } from "@/lib/store/user/types";
import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { cookies } from "next/headers";


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


export const loginUser = async (user: UserLoginData): Promise<UserLoginResponse> => {
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
  let cookiesStore = await cookies()
  console.log("url", `/user/rms-user-land/`)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DMS_API_URL}/user/rms-user-land/`, {
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
    cookiesStore.set("access", response_data.sso_access_token)
    cookiesStore.set("refresh", response_data.sso_refresh_token)
    return response_data

  } catch (error: any) {
    console.log("error", error)
    console.log("error - message", error.response.data.message)

    return empty_login_response
  }
}