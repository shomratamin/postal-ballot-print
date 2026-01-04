
import { verify_jwt } from '@/lib/utils/jwtVerify'
import { NextRequest, NextResponse } from 'next/server'

// export async function GET(request: Request) {
//     try {
//         // Make a POST request to the external API to get the redirect token
//         const body = {
//             internal_identifier: 'booking',
//             redirect_url: `${process.env.NEXT_PUBLIC_SELF_API_URL}/api/user/land`
//         };
//         console.log("calling login redirect token", body)
//         // http://booking-front.com:3000/api/user/land
//         const response = await fetch(
//             `${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/service-user-request/`, {
//             cache: "no-cache",
//             method: 'POST',
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(body)
//         })

//         const res = await response.json();
//         console.log("login res ----> ", res)
//         if (res.error && res.error.length > 0) {
//             return NextResponse.json({ error: res.error }, { status: 500 });
//         }
//         console.log("res ----> ", res.redirect_token)
//         // Redirect the user to the Django SSO login page with the redirect URL
//         const redirectUrl = `${process.env.NEXT_PUBLIC_SSO_FRONTEND_API_URL}/login?redirect=${encodeURIComponent(res.redirect_token)}`;
//         // const redirectUrl = `http://localhost:3001/login?redirect=123`;
//         console.log("redirectUrl ----> ", redirectUrl)
//         return NextResponse.redirect(redirectUrl);
//     } catch (error) {
//         console.error('Error fetching redirect token:', error);
//         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//     }
// }

// // Helper function to get the base domain from a URL
// const getBaseDomain = (url: string): string => {
//     const hostname = new URL(url).hostname;
//     // If the hostname is something like "www.example.com", get "example.com"
//     const parts = hostname.split('.');
//     return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
// };


export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse JSON body instead of form data
        const userData = await request.json();

        console.log("got user data", userData, process.env.NEXT_PUBLIC_DMS_INTERNAL_API_URL);

        // Call the DMS API
        const dmsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_DMS_INTERNAL_API_URL}/user/rms-user-land/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        console.log("DMS API response status:", dmsResponse.status);

        if (dmsResponse.status === 401) {
            console.log("Unauthorized access");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!dmsResponse.ok) {
            console.log("DMS API error:", dmsResponse.statusText);
            return NextResponse.json({ error: 'Login failed' }, { status: dmsResponse.status });
        }

        const dmsData = await dmsResponse.json();
        console.log("DMS API response data:", dmsData);

        // Extract tokens from response
        const access = dmsData.sso_access_token;
        const refresh = dmsData.sso_refresh_token;

        if (!access || !refresh) {
            return NextResponse.json({ error: 'Missing tokens in response' }, { status: 400 });
        }

        // Create redirect response
        const response = NextResponse.json(dmsData, { status: 200 });

        response.headers.set('Access-Control-Allow-Origin', `${process.env.NEXT_PUBLIC_DMS_API_URL}`);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        // Set the cookies
        response.cookies.set('access', access, { httpOnly: false, path: '/' });
        response.cookies.set('refresh', refresh, { httpOnly: false, path: '/' });

        return response;

    } catch (error) {
        console.error('Error processing login request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle OPTIONS requests to support CORS preflight
export function OPTIONS(): NextResponse {
    const response = new NextResponse(null, { status: 204 });

    response.headers.set('Access-Control-Allow-Origin', `${process.env.NEXT_PUBLIC_SSO_FRONTEND_API_URL}`);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}