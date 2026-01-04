import { UserForgetPassword, UserVerifyOTPResponse } from "@/lib/store/user/types"

export const handleForgotPass = async (user: UserForgetPassword): Promise<UserVerifyOTPResponse> => {
    const formData = new FormData()
    formData.append('phone', `${user.phone}`);
    // // console.log(11,user.phone);
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forget-password`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        });

        const data = await response.json()
        // console.log("forget resp data", data)

        if (!response.ok) {
            // console.log("response login", response)
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

    }



    catch (err) {
        // console.log("error login user", err)
        return {
            "status": "failed",
            "message": "Error occurred while submitting the form",
            "data": null
        }
    }
}
