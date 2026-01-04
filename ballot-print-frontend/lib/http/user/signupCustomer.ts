import { UserRegisterOtpData, UserSignupResponse } from "@/lib/store/user/types"

export const signupCustomer = async (user: UserRegisterOtpData): Promise<UserSignupResponse> => {
    const formData = new FormData()
    formData.append('phone', `${user.phone}`);
    formData.append('password', user.password);
    formData.append('repassword', user.repassword);


    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/register-otp`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        })
        const data = await response.json()
        // console.log("signup resp data", data)
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

    } catch (err) {
        // console.log("error login user", err)
        return {
            "status": "failed",
            "message": "Error occurred while submitting the form",
            "data": null
        }
    }

}
