import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  InputOtp,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import React, { use, useEffect, useState } from "react";

import { VpLocale } from "@/dictionaries/types";

import Cookies from "js-cookie";
import { useFetchVpInfo } from "@/lib/hooks/useFetchVpInfo";
import {
  VpListRow,
  VpPayMoneyRequest,
  VpReceiveRequest,
  VpReceiveResponse,
  VpSendOTPRequest,
} from "@/lib/store/common/types";
import { initialVpListRow } from "@/lib/store/common/store";
import CellValue from "./vpModalCell";
import { capitalize } from "lodash";
import { useReceiveVpAmount } from "@/lib/hooks/useReceiveVpAmount";
import { useSendOTPVp } from "@/lib/hooks/useSendOTPVp";
import { usePayWithOTP } from "@/lib/hooks/usePayWithOTP";

export interface VpReceiveModalModalProps {
  isOpen: any;
  onClose: any;
  barcode: string;
  vpLocale: VpLocale;
  refetchVpList: () => void;
  lang: string;
}

export default function VpReceiveModal({
  lang,
  isOpen,
  onClose,
  vpLocale,
  barcode,
  refetchVpList,
}: VpReceiveModalModalProps) {
  let token = Cookies.get("access") || "";

  let {
    isLoading: isVpInfoLoading,
    isFetching: isVpInfoFetching,
    isError: isVpInfoError,
    data: vpInfo,
    error: vpInfoError,
    refetch: refetchVpInfo,
  } = useFetchVpInfo(token, barcode);

  const [resMessages, setResMessages] = useState<string[]>([]);

  const [otpJustSent, setOtpJustSent] = useState(false);
  const [optimisticExpireAt, setOptimisticExpireAt] = useState<number | null>(
    null
  );

  const [isVpReceiveLoading, setVpReceiveLoading] = useState<boolean>(false);
  const [isVpSendOTPLoading, setVpSendOTPLoading] = useState<boolean>(false);
  const [isVpPayWithOTPLoading, setVpPayWithOTPLoading] =
    useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");

  let vp_data: VpListRow = vpInfo?.data || initialVpListRow;
  console.log(" vp data :", vp_data);
  // console.log("vpInfo from vp receive modal", vpInfo, isVpInfoLoading, isVpInfoFetching, isVpInfoError, vpInfoError);
  let { mutate } = useReceiveVpAmount();
  let { mutate: send_otp, data: otpData } = useSendOTPVp();
  // console.log("otpData from send otp %%%%%", otpData.message);
  let { mutate: pay_with_otp } = usePayWithOTP();
  useEffect(() => {
    if (!isOpen || !barcode) return;
    setResMessages([]);
    setOtp("");
    refetchVpInfo();
    if (isOpen) {
      setOtpJustSent(false);
      setOptimisticExpireAt(null);
    } // <— pull fresh otp_status/expiry every open
  }, [isOpen, barcode, refetchVpInfo]);
  const isReceived = vp_data.received_status === "Received";
  const serverOtpStatus = vp_data.otp_status as string;

  console.log("serverOtpStatus --->>>", serverOtpStatus);

  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  const otpStatusTranslations: Record<string, Record<string, string>> = {
    en: {
      pending: "Pending",
      "sent success": "Sent Success",
      "sent failed": "Sent Failed",
      verified: "Verified",
      expired: "Expired",
    },
    bn: {
      pending: "অপেক্ষমান",
      "sent success": "সফল",
      "sent failed": "বাতিল",
      verified: "ভেরিফাইড",
      expired: "মেয়াদোত্তীর্ণ",
    },
  };

  const paidStatusTranslations: Record<string, Record<string, string>> = {
    en: {
      Pending: "Pending",
      Paid: "Paid",
    },
    bn: {
      Pending: "অপেক্ষমান",
      Paid: "পরিশোধিত",
    },
  };

  const serviceTypeTranslations: Record<string, Record<string, string>> = {
    en: {
      book_packet: "Book Packet",
      digital_commerce: "Digital Commerce ",
      speed_post: "Speed Post ",
      parcel: "Parcel",
      document: "Document",
      letter: "Letter",
    },
    bn: {
      book_packet: "বুক প্যাকেট (প্রিন্টেড পাবলিকেশনস)",
      digital_commerce: "ডিজিটাল কমার্স (হোম ডেলিভারী)",
      speed_post: "স্পীড পোস্ট (উইন্ডো ডেলিভারী)",
      parcel: "পার্সেল",
      document: "ডকুমেন্ট",
      letter: "পত্র/চিঠি",
    },
  };

  const getLocalizedOtpStatus = (status: string, lang: string): string => {
    console.log(
      "getLocalizedOtpStatus called with status:",
      status,
      "and lang:",
      lang
    );
    const translations =
      otpStatusTranslations[lang] || otpStatusTranslations["en"];
    // Convert status to lowercase for matching translation keys
    const normalizedStatus = status.toLowerCase();
    return translations[normalizedStatus] || capitalize(status);
  };

  const getLocalizedPaidStatus = (status: string, lang: string): string => {
    const translations =
      paidStatusTranslations[lang] || paidStatusTranslations["en"];
    return translations[status] || capitalize(status);
  };

  const getLocalizedServiceType = (key: string, lang: string): string => {
    const translations =
      serviceTypeTranslations[lang] || serviceTypeTranslations["en"];
    return translations[key] || capitalize(key.replace(/_/g, " "));
  };

  const serverExpireTs = vp_data?.otp_expired_at
    ? Date.parse(vp_data.otp_expired_at)
    : null;

  // OTP_STATUS_CHOICES = [
  //     ("pending", "Pending"),
  //     ("sent_success", "Sent Success"),
  //     ("sent_failed", "Sent Failed"),
  //     ("verified", "Verified"),
  // ]
  // Use local optimistic status/expiry if present
  // const effectiveOtpStatus = otpJustSent ? "Sent Success" : serverOtpStatus;
  const effectiveOtpStatus = otpJustSent ? "Sent Success" : serverOtpStatus;

  console.log("otpJustSent --->>>", otpJustSent);
  console.log("effectiveOtpStatus --->>>", effectiveOtpStatus);

  const effectiveExpireTs = otpJustSent
    ? optimisticExpireAt // may be null if backend doesn't give TTL
    : serverExpireTs;

  const isOtpExpired =
    isReceived &&
    effectiveOtpStatus === "Sent Success" &&
    effectiveExpireTs !== null &&
    nowTs >= effectiveExpireTs;

  const canSendOtp =
    isReceived &&
    (effectiveOtpStatus === "Pending" ||
      effectiveOtpStatus === "Sent Failed" ||
      effectiveOtpStatus === "Expired" ||
      isOtpExpired);

  const canPayWithOtp =
    isReceived && effectiveOtpStatus === "Sent Success" && !isOtpExpired;

  // Optional: for chip text
  const otpStatusDisplay = isOtpExpired ? "Expired" : effectiveOtpStatus;
  // console.log("otpStatusDisplay --->>>", otpStatusDisplay);

  const handleReceive = () => {
    setVpReceiveLoading(true);
    // Handle receive logic here
    console.log("Receive button clicked");
    let transformed_values: VpReceiveRequest = {
      barcode: vpInfo?.data?.article_barcode || "",
      token: token,
    };
    mutate(transformed_values, {
      onSuccess: (response: VpReceiveResponse) => {
        // console.log("Form submitted successfully");
        console.log("vp receive response", response);
        setVpReceiveLoading(false);
        setResMessages([
          ...resMessages,
          response.message || "VP money received successfully",
        ]);
        refetchVpList();
      },
      onError: (response) => {
        console.log("An error occured while receiving VP Money");
        console.log(response);
        setVpReceiveLoading(false);
        setResMessages([
          ...resMessages,
          response.message ||
            "VP money can not be received due to unexpected error.",
        ]);
      },
    });
  };

  // const handleSendOTP = () => {
  //   setVpSendOTPLoading(true)
  //   // Handle receive logic here
  //   console.log("Send OTP button clicked");
  //   let transformed_values: VpSendOTPRequest = {
  //     barcode: vpInfo?.data?.article_barcode || "",
  //     token: token
  //   }
  //   send_otp(transformed_values, {
  //     onSuccess: (response: VpReceiveResponse) => {
  //       // console.log("Form submitted successfully");
  //       console.log("vp send OTP response", response);
  //       setVpSendOTPLoading(false)
  //       setResMessages([...resMessages, response.message || "VP money paid successfully"])
  //       // refetchVpList()
  //     },
  //     onError: (response) => {
  //       console.log("An error occured while sending VP OTP");
  //       console.log(response);
  //       setVpSendOTPLoading(false)
  //       setResMessages([...resMessages, response.message || "VP money can not be paid due to unexpected error."])
  //       // refetchVpList()

  //     }
  //   })
  // };
  const handleSendOTP = () => {
    setVpSendOTPLoading(true);
    const transformed_values: VpSendOTPRequest = {
      barcode: vpInfo?.data?.article_barcode || "",
      token,
    };
    send_otp(transformed_values, {
      onSuccess: (response: VpReceiveResponse) => {
        setVpSendOTPLoading(false);
        setResMessages((m) => [
          ...m,
          response.message || "OTP sent successfully",
        ]);

        // ✅ Optimistic UI: immediately show OTP input + Pay button
        setOtpJustSent(true);
        setOtp(""); // clear any previous input

        // If your backend returns an expiry timestamp, set it here:
        // setOptimisticExpireAt(Date.parse(response.data.otp_expired_at));

        // Pull fresh server state; when it arrives, UI will naturally continue working
        refetchVpInfo?.();
        // (Keep the modal open; do not call onClose)
      },
      onError: (response: any) => {
        setVpSendOTPLoading(false);
        setResMessages((m) => [
          ...m,
          response?.message || "Could not send OTP due to an unexpected error.",
        ]);
      },
    });
  };

  const handlePay = () => {
    if (!otp || otp.length < 6) {
      setResMessages([...resMessages, vpLocale.please_enter_valid_otp]);
      return;
    }
    setVpPayWithOTPLoading(true);
    // Handle receive logic here
    console.log("Receive button clicked");
    let transformed_values: VpPayMoneyRequest = {
      barcode: vpInfo?.data?.article_barcode || "",
      token: token,
      otp: otp,
    };
    pay_with_otp(transformed_values, {
      onSuccess: (response: VpReceiveResponse) => {
        // console.log("Form submitted successfully");
        console.log("vp receive response", response);
        setVpPayWithOTPLoading(false);
        setResMessages([
          ...resMessages,
          response.message || "VP money paid successfully",
        ]);
        refetchVpList();
      },
      onError: (response) => {
        console.log("An error occured while receiving VP Money");
        console.log(response);
        setVpPayWithOTPLoading(false);
        setResMessages([
          ...resMessages,
          response.message ||
            "VP money can not be paid due to unexpected error.",
        ]);
      },
    });
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior={"outside"}
        placement="top-center"
        size="2xl"
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
              <ModalBody>
                <div className="">
                  <p className="text-xl font-medium text-postDarkest dark:text-postLightest">
                    {vpLocale.value_payable}
                  </p>
                  <p className="text-small text-default-400 max-w-[90%]">
                    {vp_data.article_barcode}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 pb-1">
                    {/* Service Type Chip */}

                    {/* <Chip variant="flat" color="primary">
                      {capitalize(vp_data.article_service_type_name)}
                    </Chip> */}

                    <Chip variant="flat" color="primary">
                      {getLocalizedServiceType(
                        vp_data.article_service_type_name,
                        lang
                      )}
                    </Chip>

                    <Chip
                      variant="flat"
                      color={
                        vp_data.received_status == "Received"
                          ? "success"
                          : "default"
                      }
                    >
                      {vp_data.received_status == "Received"
                        ? vpLocale.amount_received
                        : vpLocale.amount_not_received}
                    </Chip>

                    {/* <Chip
                      variant="flat"
                      color={
                        otpStatusDisplay === "Verified"
                          ? "success"
                          : otpStatusDisplay === "Expired"
                          ? "danger"
                          : "default"
                      }
                    >
                      
                      {vpLocale.otp_verification}
                      {otpStatusDisplay}
                    </Chip> */}

                    <Chip
                      variant="flat"
                      color={
                        otpStatusDisplay === "Verified" ||
                        otpStatusDisplay === "Sent Success"
                          ? "success"
                          : otpStatusDisplay === "Expired"
                          ? "danger"
                          : otpStatusDisplay === "Pending"
                          ? "warning"
                          : "default"
                      }
                    >
                      {vpLocale.otp_verification}{" "}
                      {getLocalizedOtpStatus(otpStatusDisplay, lang)}
                    </Chip>

                    <Chip
                      variant="flat"
                      color={
                        vp_data.paid_status == "Paid" ? "success" : "default"
                      }
                    >
                      {vpLocale.payment}{" "}
                      {getLocalizedPaidStatus(vp_data.paid_status, lang)}
                    </Chip>
                  </div>

                  <p className="text-small text-foreground py-3">
                    {vpLocale.sms_will_be_sent_after_receive}.
                  </p>

                  <Alert
                    color={"primary"}
                    title={
                      vp_data.received_status == "Received" &&
                      vp_data.otp_status !== "Verified"
                        ? `${vpLocale.please_share_this_otp} ${vp_data.payable_amount}`
                        : `${vpLocale.your_vp_amount_of_tk}. ${vp_data.payable_amount} ${vpLocale.is_ready}. ${vpLocale.visit} ${vp_data.booked_branch_name} ${vpLocale.post_office_with_booking_id}: ${vp_data.booking_id} ${vpLocale.to_collect_your_payment}.`
                    }
                  />
                  <div className="flex gap-2 pt-3">
                    <p>
                      <span className="text-small text-default-500 font-medium">
                        {vpLocale.created_at}
                      </span>
                      &nbsp;
                      <span className="text-small text-default-400">
                        {vp_data.created_at}
                      </span>
                    </p>
                    <p>
                      <span className="text-small text-default-500 font-medium">
                        {vpLocale.created_by}
                      </span>
                      &nbsp;
                      <span className="text-small text-default-400">
                        {vp_data.created_by_name}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <CellValue
                      label={vpLocale.receiver_name}
                      value={
                        vp_data.sender_name &&
                        vp_data.sender_name != "0" &&
                        vp_data.sender_name.length > 1
                          ? vp_data.sender_name
                          : "N/A"
                      }
                    />
                    {/* Birthday */}
                    <CellValue
                      label={vpLocale.receiver_phone}
                      value={
                        vp_data.sender_phone &&
                        vp_data.sender_phone != "0" &&
                        vp_data.sender_phone.length > 1
                          ? vp_data.sender_phone
                          : "N/A"
                      }
                    />
                    {/* Country */}

                    <CellValue
                      label={vpLocale.branch_name}
                      value={
                        vp_data.booked_branch_name &&
                        vp_data.booked_branch_name != "0" &&
                        vp_data.booked_branch_name != "Unknown Branch" &&
                        vp_data.booked_branch_name.length > 1
                          ? vp_data.booked_branch_name
                          : "N/A"
                      }
                    />
                    {/* Address */}
                    <CellValue
                      label={vpLocale.branch_code}
                      value={
                        vp_data.booked_branch_code &&
                        vp_data.booked_branch_code != "0" &&
                        vp_data.booked_branch_code != "9999" &&
                        vp_data.booked_branch_code.length > 1
                          ? vp_data.booked_branch_code
                          : "N/A"
                      }
                    />
                    {/* Zip Code */}
                    <CellValue
                      label={vpLocale.vp_amount}
                      value={
                        vp_data.payable_amount &&
                        vp_data.payable_amount != "0" &&
                        vp_data.payable_amount.length > 1
                          ? vp_data.payable_amount
                          : "N/A"
                      }
                    />
                    {/* Phone Number */}
                    <CellValue
                      label={vpLocale.vp_commission}
                      value={
                        vp_data.commission &&
                        vp_data.commission != "0" &&
                        vp_data.commission.length > 1
                          ? vp_data.commission
                          : "N/A"
                      }
                    />
                    {/* Email */}
                  </div>
                </div>
                {canPayWithOtp && (
                  <div>
                    <p className="text-lg text-center w-full font-bold text-postDarkest dark:text-postLightest">
                      {vpLocale.otp}
                    </p>
                    <InputOtp
                      length={6}
                      value={otp}
                      onValueChange={setOtp}
                      className="w-full text-postDarkest dark:text-postLightest flex justify-center items-center"
                      variant="bordered"
                    />
                  </div>
                )}

                {/* <Chip
                  variant="flat"
                  color={
                    otpStatusDisplay === "Verified" || otpStatusDisplay === "Sent Success"
                      ? "success"
                      : otpStatusDisplay === "Expired"
                      ? "danger"
                      : otpStatusDisplay === "Pending"
                      ? "warning"
                      : "default"
                  }
                >
                  
                  {vpLocale.otp_verification} {getLocalizedOtpStatus(otpStatusDisplay, lang)}

                  <p className="text-sm font-medium text-default-600">
                    {otpJustSent && otpData?.message === "OTP sent to user phone number."
                      ? `📞 ${vpLocale.otp_sent_to_phone}`
                      : `${vpLocale.otp_verification} ${getLocalizedOtpStatus(otpStatusDisplay, lang)}`}
                  </p>

                  {!otpJustSent && (
                    <p className="text-sm font-medium text-default-600">
                      {`${vpLocale.otp_verification} ${getLocalizedOtpStatus(otpStatusDisplay, lang)}`}
                    </p>
                  )}

                </Chip> */}

                {!otpJustSent && (
                  <Chip
                    variant="flat"
                    color={
                      otpStatusDisplay === "Verified" ||
                      otpStatusDisplay === "Sent Success"
                        ? "success"
                        : otpStatusDisplay === "Expired"
                        ? "danger"
                        : otpStatusDisplay === "Pending"
                        ? "warning"
                        : "default"
                    }
                  >
                    <p className="text-sm font-medium text-default-600">
                      {`${vpLocale.otp_verification} ${getLocalizedOtpStatus(
                        otpStatusDisplay,
                        lang
                      )}`}
                    </p>
                  </Chip>
                )}

                {resMessages && resMessages.length > 0
                  ? resMessages.map((msg, index) => (
                      <Alert
                        key={index}
                        className="mt-2"
                        color="primary"
                        title={
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span>{msg}</span>
                            </div>
                            <button
                              type="button"
                              className="ml-4 text-lg text-default-500 hover:text-danger font-bold"
                              aria-label="Remove"
                              onClick={() => {
                                let newMessages = resMessages.filter(
                                  (_, i) => i !== index
                                );
                                setResMessages(newMessages);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        }
                      />
                    ))
                  : ""}
              </ModalBody>

              <ModalFooter>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    color="default"
                    variant="bordered"
                    onPress={onClose}
                    className="w-full sm:w-auto"
                  >
                    {vpLocale.close}
                  </Button>

                  {vp_data.received_status === "Pending" && (
                    <Button
                      color="primary"
                      isLoading={isVpReceiveLoading}
                      onPress={handleReceive}
                      isDisabled={isVpInfoLoading}
                      className="w-full sm:w-auto"
                    >
                      {vpLocale.receive_vp_money}
                    </Button>
                  )}

                  {canSendOtp && (
                    <Button
                      color="primary"
                      isLoading={isVpSendOTPLoading}
                      onPress={handleSendOTP}
                      isDisabled={isVpSendOTPLoading}
                      className="w-full sm:w-auto"
                    >
                      {vpLocale.send_otp}
                    </Button>
                  )}

                  {canPayWithOtp && (
                    <Button
                      color="primary"
                      isLoading={isVpPayWithOTPLoading}
                      onPress={handlePay}
                      isDisabled={isVpPayWithOTPLoading}
                      className="w-full sm:w-auto"
                    >
                      {vpLocale.pay_vp_money}
                    </Button>
                  )}
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
