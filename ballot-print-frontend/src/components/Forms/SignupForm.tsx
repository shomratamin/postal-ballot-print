"use client"

import { Card, Button } from "@heroui/react"
import { motion } from "framer-motion"
import MaterialInput from "../common/MaterialInput"
import { CommonLocale, LoginLocale } from "@/dictionaries/types"
import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from 'yup';
import { UserRegisterOtpData } from "@/lib/store/user/types"
import { signup_user } from "@/lib/store/user/actions"
import { useRouter } from "next/navigation"
 



export default function SignupForm({ loginLocale, commonLocale }: { loginLocale: LoginLocale, commonLocale: CommonLocale }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const formik = useFormik({
        initialValues: {
            phone: '',
            password: '',
            repassword: ''
        },
        validationSchema: Yup.object({
            phone: Yup.string()
                .length(11, commonLocale.invalid_mobile_length)
                .matches(/^01/, commonLocale.invalid_bd_mobile)
                .matches(/^-?\d+$/, commonLocale.invalid_bd_mobile)
                .required(commonLocale.required_field),
            password: Yup.string()
                .required(commonLocale.required_field),
        }),
        onSubmit: async (values) => {

            setLoading(true)
            setError("")

            // // console.log(JSON.stringify(values));
            let transformed_values: UserRegisterOtpData = {
                password: values.password,
                phone: values.phone,
                repassword: values.repassword
            }

            const signup_res = await signup_user(transformed_values)
            // console.log(signup_res);
            if (signup_res.status == "failed") {
                setLoading(false)
                setError(signup_res.message)

            }
            else if (signup_res.status == "success") {
                setLoading(false)
                router.push("/otp")
            }

        }
    });
    return (
        <form onSubmit={formik.handleSubmit}>
            <motion.div className="mb-2"
                key="mobile"
                // transition={{ ease: "easeInOut" }}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: .1, delay: 0.1 }}

            >
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


            </motion.div>
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
                    autoComplete="new-password"
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
            <p className='pb-2 text-postRed'>{error}</p>

            <div className="mb-6">
            
                <Button
                    type="submit"
                    color='success'
                    className='w-full text-white py-6 text-md'
                    isLoading={loading}
                >
                    {loginLocale.registration_prompt}

                </Button>
             

            </div>
        </form>

    )
}

