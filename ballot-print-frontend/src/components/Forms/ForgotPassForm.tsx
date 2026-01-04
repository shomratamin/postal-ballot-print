"use client"

import { Card, Button } from "@heroui/react"
import { motion } from "framer-motion"
import MaterialInput from "../common/MaterialInput"
import { CommonLocale, LoginLocale } from "@/dictionaries/types"
import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from 'yup';
import { UserForgetPasswordData, UserLoginData } from "@/lib/store/user/types"
import { forget_password, setPhoneCookies } from "@/lib/store/user/actions"
import { useRouter } from "next/navigation"
import { cookies } from "next/headers"


export default function ForgotpasswordForm({ loginLocale }: { loginLocale: LoginLocale, commonLocale: CommonLocale }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const formik = useFormik({
        initialValues: {
            phone: '',
            password: ''
        },

        validationSchema: Yup.object({
            phone: Yup.string()
                .required("পূরণ করা আবশ্যক")
                .matches(/^\d{11}$/, "মোবাইল নম্বর অবশ্যই ১১ সংখ্যার হতে হবে")
                .matches(/^01[3-9]\d{8}$/, "অবৈধ মোবাইল নম্বর"),
        }),

        onSubmit: async (values) => {
            setLoading(true)
            setError("")
            // // console.log(11,values);
            const phone = values.phone;

            setPhoneCookies(phone)

            let transformed_values: UserForgetPasswordData = {
                phone: values.phone
            }
            const forget_res = await forget_password(transformed_values)
            // // console.log("res",forget_res);

            if (forget_res.status == "failed") {
                setLoading(false)
                setError(forget_res.message)

            }
            else if (forget_res.status == "success") {
                setLoading(false)
                setError(forget_res.message)
                router.push("/change_password_otp")
            }

        }
    });
    return (

        <form onSubmit={formik.handleSubmit}>

            <MaterialInput
                id="phone"
                name="phone"
                whenChange={formik.handleChange}
                whenBlur={formik.handleBlur}
                value={formik.values.phone}
                error={formik.errors.phone || ""}
                type="text"
                label={loginLocale.mobile}
            />




            <p className='pb-2 text-postRed'>{error}</p>

            <div className="mb-6">

                <Button
                    type="submit"
                    color='success'
                    className='w-full text-white py-6 text-md'
                    isLoading={loading}
                >
                    {loginLocale.send_otp}

                </Button>


            </div>
        </form>

    )
}

// function handleCustomerLogin(transformed_values: UserForgetPasswordData) {
//     throw new Error("Function not implemented.")
// }
