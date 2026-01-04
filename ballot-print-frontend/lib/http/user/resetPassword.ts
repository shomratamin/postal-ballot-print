import { UserVerifyOTPResponse, changePasswordForm } from "@/lib/store/user/types"

export const resetPassword = async (user: changePasswordForm): Promise<UserVerifyOTPResponse> => {

    // let phone = cookies().get("phone")
    // // console.log("phone from cookie",phone);


    const formData = new FormData()

    formData.append('otp', `${user.otp}`);
    formData.append('password', user.password);
    formData.append('password_confirmation', user.password_confirmation);
    formData.append('phone', user.phone);

    // // console.log("phone from cookie",formData);



    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forget-password-update`, {
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
