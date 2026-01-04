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
import { UserForgetPasswordData, UserRegisterOtpData, UserSignupResponse, UserVerifyOtpData, UserVerifyResponse, changePasswordForm } from "@/lib/store/user/types"
import { forget_password, resend_user_otp } from "@/lib/store/user/actions"
import { useRouter } from "next/navigation"
import { resetPassword } from "@/lib/http/user/resetPassword"



export default function ChangePassOtpForm({ lang, loginLocale, commonLocale, phone }: { lang: Locale, loginLocale: LoginLocale, commonLocale: CommonLocale, phone: string }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const router = useRouter()
    const [secondsLeft, setSecondsLeft] = useState(180);


    // // console.log("phone from cookies",phone);

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
            password: '',
            repassword: ''
        },
        validationSchema: Yup.object({
            otp: Yup.string()
                .length(4, "৪ অক্ষর দীর্ঘ হতে হবে")
                .matches(/^-?\d+$/, "নাম্বার হতে হবে")
                .required("পূরণ করা আবশ্যক"),
        }),





        onSubmit: async (values) => {

            // if (!phone.length) {
            //     setError("Phone number was not found.")
            //     return
            // }



            let temp_data: changePasswordForm = {
                phone: phone,
                password: values.password,
                password_confirmation: values.repassword,
                otp: values.otp,
            }

            setLoading(true)
            setError("")

            let transformed_values: changePasswordForm = {
                otp: values.otp,
                phone: temp_data.phone,
                password: values.password,
                password_confirmation: values.repassword,
            };

            // // console.log("temp_data",temp_data);
            // // console.log("temp_data2222",transformed_values);

            const signup_res = await resetPassword(transformed_values)
            // console.log(signup_res);

            if (signup_res.status == "failed") {
                setLoading(false)
                setError(signup_res.message)

            }
            else if (signup_res.status == "success") {
                setLoading(false)
                router.push("/")
            }


            // const user_verify_otp_res = await verify_user_otp(transformed_values)
            // // console.log("user_verify_otp_res", user_verify_otp_res)

            // if (user_verify_otp_res.status == "success") {
            //     setLoading(false)
            //     router.push("/")
            // } else {
            //     setLoading(false)
            //     setError(user_verify_otp_res.message)
            // }


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
            if (phone.length == 0) {
                setError("Please provide a phone number.");
                return;
            }
            setResendLoading(true);
            // Restart the countdown only if it has reached 0
            setSecondsLeft(120);

            let transformed_values: UserForgetPasswordData = {

                phone: phone,
            };

            const forget_res = await forget_password(transformed_values)
            // console.log("res", forget_res);
            if (forget_res.status == "failed") {
                setLoading(false)
                setError(forget_res.message)

            }
            else if (forget_res.status == "success") {
                setLoading(false)
                setError(forget_res.message)
                router.push("/otp")
            }

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


                <motion.div className="mb-2"
                    key="password"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: .1, delay: 0.15 }}

                >
                    <MaterialInput
                        id="password"
                        name="password"
                        whenChange={formik.handleChange}
                        whenBlur={formik.handleBlur}
                        value={formik.values.password}
                        error={formik.errors.password || ""}
                        type="password"
                        label={loginLocale.password}
                    />


                </motion.div>
                <motion.div className="mb-2"
                    key="repassword"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: .1, delay: 0.15 }}

                >
                    <MaterialInput
                        id="repassword"
                        name="repassword"
                        whenChange={formik.handleChange}
                        whenBlur={formik.handleBlur}
                        value={formik.values.repassword}
                        error={formik.errors.repassword || ""}
                        type="password"
                        label={loginLocale.confirm_password}
                    />


                </motion.div>
                <p className="pl-2 text-postRed">{error}</p>



            </motion.div>




            {/* <p className='pb-2 text-postRed'>{error}</p> */}

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