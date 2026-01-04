"use server"
import { cookies } from "next/headers"
import { verify_jwt } from "./jwtVerify"

export interface VerifiedUser {
    username: string;
    legal_name: string;
    uuid: string;
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    branch_code?: string;
    phone: string;
    email?: string;
    avatar?: string;
    nid_no?: string;
    phone_verified: boolean;
    permissions: string[];
}


export const verify_cookies = async (): Promise<VerifiedUser | null> => {
    let cookieStore = await cookies()
    const access = cookieStore.get("access")?.value
    let verified = null
    if (access) {
        let result = await verify_jwt(access)
        if (result) {
            let verified_user: VerifiedUser = {
                username: result.username,
                legal_name: result.legal_name,
                uuid: result.uuid,
                token_type: result.token_type,
                exp: result.exp,
                iat: result.iat,
                jti: result.jti,
                branch_code: result.branch_code,
                email: result.email,
                avatar: result.avatar,
                nid_no: result.nid_no,
                phone: result.phone,
                phone_verified: result.phone_verified,
                permissions: result.permissions
            }
            // console.log("JWT verification success", verified_user)
            return verified_user
        } else {
            // console.log("JWT verification failed")
            return verified
        }
    } else {
        return verified
    }


}