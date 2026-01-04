import { UserVerifyOtpData, UserVerifyOTPResponse } from "@/lib/store/user/types"

export const verifyUserOtp = async (user: UserVerifyOtpData): Promise<UserVerifyOTPResponse> => {
    // console.log("got user", user)
    const formData = new FormData();
    formData.append('phone', `${user.phone}`);
    formData.append('otp', user.otp);

    // console.log("url", `/api/otp-verification`)

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/otp-verification`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        })
        const data = await response.json()
        // console.log("verify otp resp data", data)
        if (!response.ok) {
            // console.log("verify otp res", response)
            return {
                "status": "failed",
                "message": data.message,
                "data": null
            }
        }
        if (data.status == "error") {
            return {
                "status": "failed",
                "message": data.message,
                "data": null
            }
        }
        return {
            "status": "success",
            "message": data.message,
            "data": data
        }

    } catch (err) {
        // console.log("error login user", err)
        return {
            "status": "failed",
            "message": "Error occurred while submitting the form",
            "data": null
        }
    }

}
