import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  Selection,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import React, { useState } from "react";

import Image from "next/image";

import { useFormik } from "formik";
import * as Yup from "yup";

import { motion } from "framer-motion";

import Link from "next/link";
import { Locale } from "@/dictionaries/dictionaty";
import MaterialInput from "../common/MaterialInput";
import { CommonLocale, LoginLocale } from "@/dictionaries/types";
import { UserLoginData } from "@/lib/store/user/types";
// import { login_user } from "@/lib/store/user/actions";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  lang: Locale;
  isOpenModal: boolean;
  onClose: () => void;
  redirect_to: string;
  loginLocale: LoginLocale;
  commonLocale: CommonLocale;
}


export default function LoginModal({
  lang,
  isOpenModal,
  onClose,
  redirect_to,
  loginLocale,
  commonLocale,
}: LoginModalProps) {
  const [error, setError] = useState(" ");
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      phone: "",
      password: "",
    },
    validationSchema: Yup.object({
      phone: Yup.string()
        .length(11, "১১ অক্ষর দীর্ঘ হতে হবে")
        .matches(/^01/, "বাংলাদেশী মোবাইল নাম্বার হতে হবে")
        .matches(/^-?\d+$/, "বাংলাদেশী মোবাইল নাম্বার হতে হবে")
        .required("পূরণ করা আবশ্যক"),
      password: Yup.string().required("পূরণ করা আবশ্যক"),
    }),
    onSubmit: async (values: { password: string; phone: string }) => {
      setLoading(true);
      setError("");

      // // console.log(JSON.stringify(values));
      // let transformed_values: UserLoginData = {
      //   password: values.password,
      //   phone: values.phone,
      // };
      // const login_resp = await login_user(transformed_values);
      // // console.log("login_resp modal", login_resp);

      // if (login_resp.status == "failed") {
      //   setLoading(false);
      //   setError(login_resp.message);
      // } else if (login_resp.status == "success") {
      //   router.push("/");
      //   onClose();
      // }
    },
  });
  const setActiveLanguage = (language: string) => {
    // dispatch({ type: SettingActions.SET_ACTIVE_LANGUAGE, payload: { language: language } })
  };

  const handlePhoneChange = (e: any) => {
    setError("");
    formik.handleChange(e);
  };
  const handleLanguageSelectionChange = (selection: Selection) => {
    // console.log("selection data", selection);
    let selection_array = Array.from(selection);
    // console.log("selection_array", selection_array);
    // console.log("selection_array_item type", typeof selection_array[0]);

    let lang: string = selection_array[0].toString();

    setActiveLanguage(lang);

    // console.log("lang --> ", lang);

    // i18n.changeLanguage(lang)
  };

  const handlePasswordChange = (e: any) => {
    setError("");
    formik.handleChange(e);
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={isOpenModal}
        onClose={onClose}
        scrollBehavior={"inside"}
        placement="top-center"
        classNames={{
          body: "py-6",
          base: "border-dgenLight",
          header: "border-b-1 border-dgenLight",
          footer: "border-t-1 border-dgenLight",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <Card
                className="xxs:w-[400px] xs:w-[450px] sm:w-[500px] md:w-[500px] lg:w-[500px] relative"
                shadow="lg"
              >
                <div className="shadow-three px-12 py-16 ">
                  <div className="mb-3 w-full flex justify-center items-center">
                    <Image
                      src="/static/images/logo/logo-icon.svg"
                      alt="logo"
                      width={100}
                      height={100}
                      className="dark:hidden"
                    />
                    <Image
                      src="/static/images/logo/logo-icon-dark.svg"
                      alt="logo"
                      width={100}
                      height={100}
                      className="hidden dark:block"
                    />
                  </div>

                  <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                    {loginLocale.title}
                  </h3>
                  <p className="mb-5 text-center text-base font-medium text-black">
                    {loginLocale.subtitle}
                  </p>

                  <div>

                    <div className="mb-6">
                      <Link href={`${process.env.NEXT_PUBLIC_SELF_API_URL}/api/user/login`}>
                        <Button
                          type="button"
                          color="success"
                          className="w-full text-white py-6 text-md"
                          isLoading={loading}
                        >
                          {loginLocale.login_label}
                        </Button>
                      </Link>

                    </div>
                  </div>
                  <p className="text-center text-base font-medium text-dark">
                    {loginLocale.no_account_prompt}
                    <Link href={`${process.env.NEXT_PUBLIC_SELF_API_URL}/api/user/signup`}>
                      <span className="inline text-primary cursor-pointer hover:underline">
                        {loginLocale.registration_prompt}
                      </span>
                    </Link>
                  </p>
                  {/* <div className="flex flex-col justify-center sm:flex-row sm:items-center">
                    <div>
                      <Link
                        href={"/forgot_password"}
                        className="text-md font-medium text-primary hover:underline"
                      >
                        {loginLocale.forgot_your_password}
                      </Link>
                    </div>
                  </div> */}
                </div>
              </Card>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
