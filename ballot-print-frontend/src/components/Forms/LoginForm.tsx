"use client"

import { Card, Button } from "@heroui/react"
import { motion } from "framer-motion"
import MaterialInput from "../common/MaterialInput"
import { CommonLocale, LoginLocale } from "@/dictionaries/types"
import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from 'yup';
import { UserLoginData } from "@/lib/store/user/types"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"



export default function LoginForm({ loginLocale, commonLocale }: { loginLocale: LoginLocale, commonLocale: CommonLocale }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const formik = useFormik({
        initialValues: {
            username: '',
            password: ''
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .required(commonLocale.required_field),
            password: Yup.string()
                .required(commonLocale.required_field),
        }),


        onSubmit: async (values: { password: string, username: string }) => {

            setLoading(true)
            setError("")

            try {
                let transformed_values: UserLoginData = {
                    password: values.password,
                    username: values.username,
                }

                const response = await fetch('/api/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(transformed_values)
                });

                if (response.ok) {
                    // The API route will handle the redirect automatically
                    console.log("Login successful, redirecting...");
                    let responseData = await response.json();
                    console.log("Login response data", responseData);
                    Cookies.set('branch_code', responseData.branch_code);
                    Cookies.set('dms_token', responseData.dms_token);
                    Cookies.set('rms_code', responseData.rms_code);

                    router.push("/article/book");
                } else {
                    const errorData = await response.json();
                    console.log("Login failed", errorData);
                    setError("Login failed");
                    setLoading(false);
                }
            } catch (error) {
                console.log("Login error", error);
                setError("Login failed");
                setLoading(false);
            }

        }

    });




    return (
        <form onSubmit={formik.handleSubmit}>

            <motion.div className="mb-2"
                key="username"
                // transition={{ ease: "easeInOut" }}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: .1, delay: 0.1 }}

            >
                <MaterialInput
                    id="username"
                    name="username"
                    whenChange={formik.handleChange}
                    whenBlur={formik.handleBlur}
                    value={formik.values.username}
                    error={formik.errors.username || ""}
                    type="text"
                    label={loginLocale.username}
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
                    label={loginLocale.password}
                    showPasswordToggle={true}
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
                    {loginLocale.login_label}

                </Button>


            </div>
        </form>

    )
}