import {
  Alert,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,

} from "@heroui/react";
import React, { use, useEffect, useState } from "react";


import Cookies from "js-cookie";

import { useDmsBookArticle } from "@/lib/hooks/useDmsBookArticle";
import { BookDmsArticleInput, DmsBookArticleApiResponse } from "@/lib/store/post/types";
import { useRouter } from "next/navigation";
export interface BookingScanModalProps {
  isOpen: any;
  onClose: any;
}



export default function BookingScanModal({ isOpen, onClose }: BookingScanModalProps) {
  const router = useRouter();
  let token = Cookies.get("access") || "";


  const [resMessages, setResMessages] = useState<string[]>([]);

  const [barcode, setBarcode] = useState<string>("");

  const [isBookingLoading, setBookingLoading] = useState<boolean>(false);
  const { mutate: bookArticle } = useDmsBookArticle();

  const handleBook = () => {
    let transformed_value: BookDmsArticleInput = {
      barcode: barcode,
      token: token
    };
    bookArticle(transformed_value, {
      onSuccess: (data: DmsBookArticleApiResponse) => {
        setResMessages((prev) => [...prev, data.message]);
        setBookingLoading(false);
        router.push("/article/book")
      },
      onError: (error) => {
        setResMessages((prev) => [...prev, error.message]);
        setBookingLoading(false);
      },
    });
  }


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

                <p className="text-xl font-medium text-postDarkest dark:text-postLightest">Scan Barcode</p>


                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      type="text"
                      className="w-full"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </div>

                </div>
                {resMessages.length > 0 && resMessages.map((msg, index) => (
                  <Alert key={index} className="mt-4" color={msg.includes("successful") ? "success" : "danger"}>
                    {msg}
                  </Alert>
                ))}
              </ModalBody>

              <ModalFooter>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button color="default" variant="bordered" onPress={onClose} className="w-full sm:w-auto">
                    Close
                  </Button>

                  <Button
                    color="primary"
                    isLoading={isBookingLoading}
                    onPress={handleBook}
                    isDisabled={isBookingLoading}
                    className="w-full sm:w-auto"
                  >
                    Book
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}