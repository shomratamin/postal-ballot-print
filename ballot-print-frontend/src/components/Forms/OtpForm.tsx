"use client"

import { Card, Button } from "@heroui/react"
import { motion } from "framer-motion"
import MaterialInput from "../common/MaterialInput"
import { CommonLocale, LoginLocale } from "@/dictionaries/types"
import { useEffect, useState } from "react"
import { useFormik } from "formik"
import * as Yup from 'yup';
import { Locale } from "@/dictionaries/dictionaty"
import { e_to_b } from "@/lib/utils/EnglishNumberToBengali"
import { cookies } from "next/headers"
import { UserRegisterOTPResponse, UserRegisterOtpData, UserSignupResponse, UserVerifyOtpData, UserVerifyResponse } from "@/lib/store/user/types"
import { resend_user_otp } from "@/lib/store/user/actions"
import { useRouter } from "next/navigation"


export default function OtpForm({ lang, loginLocale, commonLocale, temp_data }: { lang: Locale, loginLocale: LoginLocale, commonLocale: CommonLocale, temp_data: UserRegisterOtpData }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const router = useRouter()
    const [secondsLeft, setSecondsLeft] = useState(180);


    useEffect(() => {
        let interval: any;
        if (secondsLeft > 0) {
            // Only set the interval if secondsLeft is greater than 0
            interval = setInterval(() => {
                setSecondsLeft(secondsLeft - 1);
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [secondsLeft]);





    const formik = useFormik({
        initialValues: {
            otp: '',
        },
        validationSchema: Yup.object({
            otp: Yup.string()
                .length(6, "৬ অক্ষর দীর্ঘ হতে হবে")
                .matches(/^-?\d+$/, "নাম্বার হতে হবে")
                .required("পূরণ করা আবশ্যক"),
        }),

        onSubmit: async (values: { otp: string }) => {
            if (!temp_data.phone.length) {
                setError("Phone number was not found.")
                return
            }
            setLoading(true)
            setError("")
            // // console.log("values", values);
            let transformed_values: UserVerifyOtpData = {
                otp: values.otp,
                phone: temp_data.phone,

            };
            // const user_verify_otp_res = await verify_user_otp(transformed_values)
            // // console.log("user_verify_otp_res", user_verify_otp_res)

            // if (user_verify_otp_res.status == "success") {
            //     setLoading(false)
            //     router.push("/")
            // } else {
            //     setLoading(false)
            //     setError(user_verify_otp_res.message)
            // }
            // mutate(transformed_values, {
            //   onSuccess: (response: UserVerifyResponse) => {
            //     setLoading(false);
            //     // console.log("response of otp var", response);

            //     if (response.verified == false) {
            //       setError(response.message);
            //     } else {
            //       localStorage.setItem("userToken", response.token);
            //       Cookies.set("token", response.token, {
            //         expires: 1,
            //         secure: true,
            //         sameSite: "strict",
            //       });
            //       let token_payload = {
            //         token: response.token,
            //       };
            //       dispatch({
            //         type: UserActions.SET_USER_TOKEN,
            //         payload: token_payload,
            //       });
            //       let auth_payload = {
            //         authenticated: true,
            //       };
            //       dispatch({
            //         type: UserActions.AUTHENTICATE_USER,
            //         payload: auth_payload,
            //       });
            //       let user_payload: SetUserPayload = {
            //         user: response.user,
            //       };
            //       dispatch({ type: UserActions.SET_USER, payload: user_payload });
            //       router.push("/nid");
            //     }
            //   },
            //   onError: (response) => {
            //     setLoading(false);
            //     // console.log("An error occured while submiting the form");
            //     setError("An error occured while submiting the form");
            //     // console.log(response);
            //   },
            // });



        }
    });



    const getRemainingText = (secondsLeft: number) => {
        if (lang == "en") {
            return `Resend (${secondsLeft} s)`;
        } else {
            return `পুনরায় পাঠান (${e_to_b(`${secondsLeft}`)} সেকেন্ড)`;
        }
    };

    const getSendAgainText = () => {
        if (lang == "en") {
            return "Resend OTP";
        } else {
            return `পুনরায় পাঠান`;
        }
    };

    const handleResendOtp = async () => {
        // console.log("handle resend button ", secondsLeft);
        if (secondsLeft === 0) {
            if (temp_data.phone.length == 0) {
                setError("Please provide a phone number.");
                return;
            }
            setResendLoading(true);
            // Restart the countdown only if it has reached 0
            setSecondsLeft(120);
            let transformed_values: UserRegisterOtpData = {
                password: temp_data.password,
                phone: temp_data.phone,
                repassword: temp_data.repassword,
            };

            const resend_otp_response: UserSignupResponse = await resend_user_otp(transformed_values)
            if (resend_otp_response.status == "failed") {
                setResendLoading(false);
                setError(resend_otp_response.message)

            }
            else if (resend_otp_response.status == "success") {
                setResendLoading(false);
                router.push("/otp")
            }

        } else {
            // Optionally handle the click differently if the countdown hasn't finished
            // For example: alert('Wait for the countdown to finish.');
        }
    };




    return (
        <form onSubmit={formik.handleSubmit}>
            <motion.div className="mb-2"
                key="otp"
                // transition={{ ease: "easeInOut" }}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: .1, delay: 0.1 }}

            >
                <MaterialInput
                    id="otp"
                    name="otp"
                    whenChange={formik.handleChange}
                    whenBlur={formik.handleBlur}
                    value={formik.values.otp}
                    error={formik.errors.otp || ""}
                    type="text"
                    label={loginLocale.otp}
                />
                <p className="pl-2 text-postRed">{error}</p>



            </motion.div>

            <p className='pb-2 text-postRed'>{error}</p>

            <div className="mb-6 flex justify-center items-center gap-3 w-full">
                <Button
                    color="secondary"
                    disabled={secondsLeft > 0}
                    isLoading={resendLoading}
                    className="flex-1 text-white py-6 text-md"
                    onClick={handleResendOtp}
                >
                    {secondsLeft > 0
                        ? getRemainingText(secondsLeft)
                        : getSendAgainText()}
                </Button>

                <Button
                    type="submit"
                    color='success'
                    className="flex-1 text-white py-6 text-md"
                    isLoading={loading}
                >
                    {commonLocale.next}

                </Button>


            </div>
        </form>

    )
}