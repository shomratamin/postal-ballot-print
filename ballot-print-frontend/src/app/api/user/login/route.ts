
import { UserLoginData } from '@/lib/store/user/types';
import { verify_jwt } from '@/lib/utils/jwtVerify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse JSON body instead of form data
        const userData: UserLoginData = await request.json();

        console.log("got user data", userData, process.env.NEXT_PUBLIC_BACKEND_API_URL);

        // Call the DMS API
        const dmsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/login`, {
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
        const access = dmsData.access;
        const refresh = dmsData.refresh;

        if (!access || !refresh) {
            return NextResponse.json({ error: 'Missing tokens in response' }, { status: 400 });
        }

        // Create redirect response
        const response = NextResponse.json(dmsData, { status: 200 });

        response.headers.set('Access-Control-Allow-Origin', `${process.env.NEXT_PUBLIC_BACKEND_API_URL}`);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        // Set the cookies
        response.cookies.set('access', access, { httpOnly: false, path: '/' });
        response.cookies.set('refresh', refresh, { httpOnly: false, path: '/' });

        // Set user data cookies if available
        if (dmsData.data) {
            if (dmsData.data.uuid) {
                response.cookies.set('uuid', dmsData.data.uuid, { httpOnly: false, path: '/' });
            }
            if (dmsData.data.username) {
                response.cookies.set('username', dmsData.data.username, { httpOnly: false, path: '/' });
            }
            if (dmsData.data.user_role) {
                response.cookies.set('role', dmsData.data.user_role, { httpOnly: false, path: '/' });
            }
        }

        return response;

    } catch (error) {
        console.error('Error processing login request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle OPTIONS requests to support CORS preflight
export function OPTIONS(): NextResponse {
    const response = new NextResponse(null, { status: 204 });

    response.headers.set('Access-Control-Allow-Origin', `${process.env.NEXT_PUBLIC_BACKEND_API_URL}`);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}