"use client"

import { ServiceTokenRequest } from "@/lib/store/user/types";
import { Button } from "@heroui/react";





const LoginButtonMenu = ({ btn_name }: { btn_name: string }) => {


    let req: ServiceTokenRequest = {
        internal_identifier: "booking",
        redirect_url: `${process.env.NEXT_PUBLIC_SELF_API_URL}/api/user/land`
    }


    const handleLoginClick = () => {

        console.log("handleLoginClick")
        fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/service-user-request/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req)
        }).then(async (response) => {
            console.log("response service-user-request --->", response);
            if (response.status == 401) {
                console.log("response error", response)
                return null
            }
            let json_data = await response.json()
            console.log("json_data", json_data)
            if (json_data.redirect_token && json_data.redirect_token.length > 0) {
                // Redirect the user to the Django SSO login page with the redirect URL
                const redirectUrl = `${process.env.NEXT_PUBLIC_SSO_FRONTEND_API_URL}/login?redirect=${encodeURIComponent(json_data.redirect_token)}`;
                console.log("redirectUrl ----> ", redirectUrl)
                window.location.href = redirectUrl
            } else {
                console.log("no redirect token found")
            }
        }).catch(error => {
            console.log("error", error)
        })

    }

    return (
        <Button color="success" size="lg" className="w-full text-white text-md" onPress={handleLoginClick}>
            <p>{btn_name}</p>

        </Button>
    );
};

export default LoginButtonMenu;
