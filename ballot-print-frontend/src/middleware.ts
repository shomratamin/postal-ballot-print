import { has_lang_cookie } from '@/lib/store/user/actions'
import { verify_jwt } from '@/lib/utils/jwtVerify'
import { NextRequest, NextResponse } from 'next/server'


export async function middleware(request: NextRequest) {
    // Check if there is any supported locale in the pathname
    const pathname = request.nextUrl.pathname
    // console.log("pathname", pathname)

    const response = NextResponse.next();
    // Get Token from cookie
    const refresh = request.cookies.get("refresh")?.value
    const access = request.cookies.get("access")?.value

    const lang = request.cookies.get("lang")?.value
    if (!lang) {
        response.cookies.set('lang', 'bn', { maxAge: 60 * 60 * 24 * 365 });
    }

    let verified = null

    if (access && refresh) {
        verified = await verify_jwt(access)
        console.log("JWT verification result", verified)
        if (verified) {
            let is_admin = false
            // console.log("JWT verification success", verified)
            if (request.nextUrl.pathname.startsWith('/admin')) {
                if (verified.permissions.length) {
                    for (let i = 0; i < verified.permissions.length; i++) {
                        let permission = verified.permissions[i];
                        // console.log("permission ----> ", permission)
                        let service = permission.split(".")[0];
                        if (service === "booking") {
                            let role = permission.split(".")[1];
                            console.log("role", role)
                            if (role == "admin") {
                                is_admin = true
                                console.log("land_admin_route", 'admin')
                            } else {
                                // console.log("land_admin_route ----> ", 'mashul')
                                return NextResponse.redirect(new URL(`/service`, request.url))
                            }
                        }
                    }
                }
            }
            else {
                console.log("not admin route", is_admin)
            }
        } else {
            // console.log("JWT verification failed")

            response.cookies.set('access', '', { maxAge: -1 });
            response.cookies.set('refresh', '', { maxAge: -1 });
            if (request.nextUrl.pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL(`/`, request.url))
            }

        }
    } else {
        if (request.nextUrl.pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL(`/`, request.url))
        }
    }

    // const token = request.cookies.get("token")?.value


    if (!verified && !tokenless_route(pathname)) {
        return NextResponse.redirect(new URL(`/`, request.url))
    }

    // console.log('middleware returning response')
    return response;
}


function tokenless_route(path_name: string): boolean {
    let allowed_without_token: string[] = ["", "login", "signup", "register", "otp", "forgot_password", "change_password_otp", "admin", "mashul", "print_label"]
    return allowed_without_token.some((allowedPath) => path_name.includes(allowedPath));
}


export const config = {
    matcher: [
        // Skip all internal paths (_next, assets, api)
        '/((?!api|assets|.*\\..*|_next).*)',
        // Optional: only run on root (/) URL
        // '/'
    ],
}