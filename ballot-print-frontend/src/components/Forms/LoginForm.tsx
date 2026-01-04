"use client";

import { Card, Button } from "@heroui/react";
import { motion } from "framer-motion";
import MaterialInput from "../common/MaterialInput";
import { CommonLocale, LoginLocale } from "@/dictionaries/types";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserLoginData } from "@/lib/store/user/types";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginForm({
  loginLocale,
  commonLocale,
}: {
  loginLocale: LoginLocale;
  commonLocale: CommonLocale;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      phone_number: "",
      password: "",
    },
    validationSchema: Yup.object({
      phone_number: Yup.string()
        .required(commonLocale.required_field)
        .matches(/^[0-9]+$/, "Phone number must contain only numbers")
        .matches(/^01/, "Phone number must start with 01")
        .length(11, "Phone number must be exactly 11 digits"),
      password: Yup.string().required(commonLocale.required_field),
    }),

    onSubmit: async (values: { password: string; phone_number: string }) => {
      setLoading(true);
      setError("");

      try {
        let transformed_values: UserLoginData = {
          password: values.password,
          phone_number: `+88${values.phone_number}`,
        };

        const response = await fetch("/api/user/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transformed_values),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log("Login successful", responseData);

          // Cookies are already set by the API route
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          const errorData = await response.json();
          console.log("Login failed", errorData);
          setError(errorData.error || "Login failed");
          setLoading(false);
        }
      } catch (error) {
        console.log("Login error", error);
        setError("Login failed");
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <motion.div
        className="mb-2"
        key="phone_number"
        // transition={{ ease: "easeInOut" }}
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.1, delay: 0.1 }}
      >
        <MaterialInput
          id="phone_number"
          name="phone_number"
          whenChange={formik.handleChange}
          whenBlur={formik.handleBlur}
          value={formik.values.phone_number}
          error={formik.errors.phone_number || ""}
          type="text"
          label={loginLocale.mobile}
        />
      </motion.div>
      <motion.div
        className="mb-2"
        key="password"
        // transition={{ ease: "easeInOut" }}
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.1, delay: 0.15 }}
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
      <p className="pb-2 text-postRed">{error}</p>

      <div className="mb-6">
        <Button
          type="submit"
          color="success"
          className="w-full text-white py-6 text-md"
          isLoading={loading}
        >
          {loginLocale.login_label}
        </Button>
      </div>
    </form>
  );
}
