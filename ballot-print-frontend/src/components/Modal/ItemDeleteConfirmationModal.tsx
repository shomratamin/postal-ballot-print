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

import { calcLength, motion } from "framer-motion";

import Link from "next/link";
import { Locale } from "@/dictionaries/dictionaty";
import MaterialInput from "../common/MaterialInput";
import { CommonLocale } from "@/dictionaries/types";
import { UserLoginData } from "@/lib/store/user/types";
// import { login_user } from "@/lib/store/user/actions";
// import { RiDeleteBinLine } from "react-icons/ri";
import { useRouter } from "next/navigation";

interface ItemDeleteConfirmationModalProps {
  lang: Locale;
  isOpenModal: boolean;
  onClose: () => void;
  handleConfirmDelete: () => void;
  commonLocale: CommonLocale;
}


export default function ItemDeleteConfirmationModal({
  lang,
  isOpenModal,
  onClose,
  handleConfirmDelete,
  commonLocale,
}: ItemDeleteConfirmationModalProps) {
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

  const confirmWithLoading = () => {
    setLoading(true);
    handleConfirmDelete();
  }

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
            <div className="w-[90%] max-w-[500px] mx-auto relative p-6">
              <ModalHeader className="text-center text-lg font-semibold text-black mb-3">
                <div className="flex flex-col items-center justify-center gap-2">
                  Delete
                  <p className="text-postDark dark:text-postLight">{commonLocale.confirmation_delete_cart_item}</p>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    color="default"
                    className="w-full text-white py-6 text-md"
                    onClick={onClose}
                  >
                    {commonLocale.close}
                  </Button>
                  <Button
                    type="button"
                    color="danger"
                    className="w-full text-white py-6 text-md"
                    isLoading={loading}
                    onClick={confirmWithLoading}
                  >
                    {commonLocale.ok}
                  </Button>
                </div>
              </ModalBody>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
