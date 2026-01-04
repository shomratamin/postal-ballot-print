
import { verify_jwt } from '@/lib/utils/jwtVerify';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        // Make a POST request to the external API to get the redirect token
        const body = {
            internal_identifier: 'booking',
            redirect_url: `${process.env.NEXT_PUBLIC_SELF_API_URL}/api/user/signup`
        };
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/service-user-request/`, {
            cache: "no-cache",
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const res = await response.json();
        // console.log("res ----> ", res)
        if (res.error && res.error.length > 0) {
            return NextResponse.json({ error: res.error, status: 500 });
        }
        // console.log("res ----> ", res.redirect_token)
        // Redirect the user to the Django SSO login page with the redirect URL
        const redirectUrl = `${process.env.NEXT_PUBLIC_SSO_FRONTEND_API_URL}/signup?redirect=${encodeURIComponent(res.redirect_token)}`;
        // const redirectUrl = `http://localhost:3001/login?redirect=123`;

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error('Error fetching redirect token:', error);
        return NextResponse.json({ error: 'Internal Server Error', status: 500 });
    }
}




export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const formData = await request.formData();

        // Extract the refresh and access tokens from the form data
        const refresh = formData.get('refresh') as string | null;
        const access = formData.get('access') as string | null;

        if (access && refresh) {
            // console.log('refresh', refresh);
            // console.log('access', access);

            let decoded = await verify_jwt(access)
            if (decoded) {
                // console.log("JWT verification success in sign up post", decoded)

            } else {
                // console.log("JWT verification failed")
                // removeSession()
                return NextResponse.json({ error: 'Invalid tokens' }, { status: 400 });
            }

            const body = {
                refresh: refresh,
                access: access
            };


            const reqUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/land`;

            // console.log("reqUrl ----> ", reqUrl)

            const response_land = await fetch(
                reqUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            // console.log("req body ----> ", JSON.stringify(body))

            // console.log("response_land ----> ", response_land)
            // console.log("response_land statusText ----> ", response_land.statusText)
            // console.log("response_land statusText ----> ", response_land.statusText)

            const response_land_json = await response_land.json();
            // console.log("response_land_json ----> ", response_land_json)
            if (response_land_json.error && response_land_json.error.length > 0) {
                return NextResponse.json({ error: response_land_json.error }, { status: 500 });
            }


            const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SELF_FRONT_URL}`, 303);

            response.headers.set('Access-Control-Allow-Origin', `${process.env.NEXT_PUBLIC_SSO_FRONTEND_API_URL}`);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Allow-Credentials', 'true');

            // Set the cookies
            response.cookies.set('access', access, { httpOnly: false, });
            response.cookies.set('refresh', refresh, { httpOnly: false, });

            return response;
        }

        // If access or refresh tokens are missing, return an error response
        return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: error }, { status: 500 });
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
