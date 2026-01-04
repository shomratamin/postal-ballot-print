"use server"
import { cookies } from "next/headers"
import { verify_jwt } from "./jwtVerify"


export interface VerifiedUser {
    username: string;
    user_role: string;
    legal_name: string;
    uuid: string;
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    branch_code?: string;
    phone: string;
    email?: string;
    email_verified?: boolean;
    avatar?: string;
    nid_no?: string;
    created_by?: string;
    approved_by?: string;
    phone_verified: boolean;
    permissions: string[];
    nonce: number;
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
                user_role: result.user_role,
                legal_name: result.legal_name,
                uuid: result.uuid,
                token_type: result.token_type,
                exp: result.exp,
                iat: result.iat,
                jti: result.jti,
                branch_code: result.branch_code,
                email: result.email,
                email_verified: result.email_verified,
                avatar: result.avatar,
                nid_no: result.nid_no,
                phone: result.phone,
                phone_verified: result.phone_verified,
                permissions: result.permissions,
                nonce: result.nonce,
                created_by: result.created_by,
                approved_by: result.approved_by,

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