import {
  Button,
  ModalBody,
  ModalFooter,
  ModalContent,
  Modal,
  ModalHeader,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import MaterialInput from "../common/MaterialInput";
import {
  AddressType,
  Person,
  PersonStoreRequest,
  PersonType,
} from "@/lib/store/person/types";

import MaterialSelect, { MaterialSelectItem } from "../common/MaterialSelect";
import { Locale } from "@/dictionaries/dictionaty";
import { Post, PostType } from "@/lib/store/post/types";
import MaterialTextarea from "../common/MaterialTextarea";
import { AddressLocale, CommonLocale, ValidationLocale } from "@/dictionaries/types";
import { update_person, update_post_person } from "@/lib/store/person/actions";
import { useDistricts } from "@/lib/http/hooks/useFetchDistricts";
import { usePoliceStation } from "@/lib/http/hooks/useFetchPoliceStations";
import { usePostOffice } from "@/lib/http/hooks/usePostOffice";
import { printNumber } from "@/lib/utils/EnglishNumberToBengali";
import Cookies from "js-cookie";

export interface PostSenderEditAddressModalProps {
  isOpen: any;
  onClose: (person: Person | null) => void;
  lang: Locale;
  editingPerson: Person;
  post?: Post;
  addressLocale: AddressLocale;
  validationLocale: ValidationLocale;
  commonLocale: CommonLocale;
  addressType: AddressType;
}

export default function PostSenderEditAddressModal({ isOpen, onClose, lang, editingPerson, post, addressLocale, validationLocale, commonLocale, addressType }: PostSenderEditAddressModalProps) {
  // // console.log("100", editingPerson);
  const token = Cookies.get("access") || "";
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = React.useState("");

  const [editPerson, setEditPerson] = React.useState<Person>(editingPerson);

  const { data: district_state, error: districtsError, isLoading: districtsLoading, } = useDistricts(editingPerson.person_type == PersonType["RECIPIENT"] ? "recipient" : "sender", token);

  const { data: police_station_state, error: policeStationError, isLoading: policeStationLoading, } = usePoliceStation(editPerson.district_id || 0, editingPerson.person_type == PersonType["RECIPIENT"] ? "recipient" : "sender", token);

  const { data: post_office_state, error: postOfficeError, isLoading: postOfficeLoading, } = usePostOffice(editPerson.police_station_id || 0, editingPerson.person_type == PersonType["RECIPIENT"] ? "recipient" : "sender", token);

  useEffect(() => {
    setEditPerson({
      id: editingPerson.id,
      address: editingPerson.address,
      country: editingPerson.country,
      country_id: editingPerson.country_id,
      created_at: editingPerson.created_at,
      district: editingPerson.district,
      district_id: editingPerson.district_id,
      division: editingPerson.division,
      division_id: editingPerson.division_id,
      email: editingPerson.email,
      end_time: editingPerson.end_time,
      name: editingPerson.name,
      person_type: editingPerson.person_type,
      phone: editingPerson.phone,
      police_station: editingPerson.police_station,
      police_station_id: editingPerson.police_station_id,
      post_office: editingPerson.post_office,
      post_office_id: editingPerson.post_office_id,
      start_time: editingPerson.start_time,
      title: editingPerson.title,
      updated_at: editingPerson.updated_at,
      user_id: editingPerson.user_id,
      zone: editingPerson.zone,
      zone_id: editingPerson.zone_id,
    });
  }, [editingPerson]);


  const formik = useFormik({
    initialValues: {
      name: "",
      title: "",
      phone: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().matches(/^[A-Za-z\s]+$/, "শুধুমাত্র অক্ষর লিখা যাবে"),
      title: Yup.string().matches(
        /^[A-Za-z\s]+$/,
        "শুধুমাত্র অক্ষর লিখা যাবে"
      ),
      // address: Yup.string()
      //   .required('পূরণ করা আবশ্যক')
      //   .max(200, 'সর্বোচ্চ ২০০ অক্ষর দীর্ঘ হতে পারে'),
      phone: Yup.string()
        .length(11, validationLocale.length_eleven_digits)
        .matches(/^01/, validationLocale.bd_phone)
        .matches(/^-?\d+$/, validationLocale.bd_phone),

    }),
    onSubmit: async (values) => {
      console.log("values", values)
      setLoading(true);
      console.log("editPerson", editPerson);
      if (editPerson?.id !== 0) {
        console.log("editPerson", editPerson);
        // Update Recipient
        let person_update_request: PersonStoreRequest = {
          id: editPerson?.id,
          name: editPerson?.name,
          title: editPerson?.title,
          email: editPerson?.email,
          division: editPerson?.division,
          division_id: editPerson?.division_id,
          district: editPerson?.district,
          district_id: editPerson?.district_id,
          police_station: editPerson?.police_station,
          police_station_id: editPerson?.police_station_id,
          post_office: editPerson?.post_office,
          post_office_id: editPerson?.post_office_id,
          country: editPerson?.country,
          country_id: editPerson?.country_id,
          zone: editPerson?.zone,
          zone_id: editPerson?.zone_id,
          address: editPerson ? editPerson.address : "",
          address_type: AddressType["DOMESTIC"],
          start_time: editPerson?.start_time,
          end_time: editPerson?.end_time,
          phone: editPerson?.phone,
          person_type: editPerson
            ? editPerson.person_type
            : PersonType["SENDER"],
        };

        const result_person = await update_person(
          person_update_request
        );
        if (post && result_person) {
          const result_post_update_person = await update_post_person(
            post,
            result_person
          );
          // console.log("result_post_update_person", result_post_update_person);
          setLoading(false);
          onClose(result_person);
        } else {
          setLoading(false);
          onClose(null);
        }
      }
    },
  });



  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setEditPerson({
      ...editPerson,
      name: e.target.value,
    });
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setEditPerson({
      ...editPerson,
      phone: e.target.value,
    });
  };
  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddressError("");
    setEditPerson({
      ...editPerson,
      address: e.target.value,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setEditPerson({
      ...editPerson,
      title: e.target.value,
    });
  };

  // const handleDistrictSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //     if (e.target.value) {
  //         let selected_district = setting_state.info.districts.filter(district => district.name == e.target.value)[0]
  //         let police_stations = setting_state.info.policeStations.filter(sub => sub.district_id == selected_district.id)
  //         // // console.log("selected districts", selected_district)

  //         let new_person: Person = {
  //             ...editingPerson,
  //             district: e.target.value,
  //             district_id: Number(selected_district.id),
  //             police_station: police_stations[0].name,
  //             police_station_id: Number(police_stations[0].id)
  //         }

  //         let payload: SetEditingPersonPayload = {
  //             person: new_person
  //         }
  //         dispatch({ type: PostActions.SET_EDITING_PERSON, payload: payload })
  //     }

  // };

  // const handlePoliceStationSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //     // // console.log('e.target.value', e.target.value)
  //     if (e.target.value) {
  //         let payload: SetEditingPersonPayload = {
  //             person: {
  //                 ...editingPerson,
  //                 police_station: e.target.value,
  //                 police_station_id: Number(setting_state.info.policeStations.filter(police_station => police_station.name == e.target.value)[0].id)
  //             }
  //         }
  //         dispatch({ type: PostActions.SET_EDITING_PERSON, payload: payload })
  //     }

  // };

  // const handlePostcodeSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //     // console.log('e.target.value', e.target.value)
  //     if (e.target.value && editingPerson) {
  //         let payload: SetPostRecipientPayload = {
  //             recipient: {
  //                 ...editingPerson,
  //                 post_office: e.target.value,
  //                 post_office_id: Number(setting_state.info.postOffices.filter(code => code.name == e.target.value)[0].postOffice)
  //             }
  //         }
  //         dispatch({ type: PostActions.SET_POST_RECIPIENT, payload: payload })
  //     }

  // };

  const handleDistrictSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value) {
      // let selected_district = Array.from(districts).filter(
      //   (district: District) => district.en_name == e.target.value
      // )[0];
      // let police_stations = police_station_state.filter(
      //   (police_station: PoliceStation) =>
      //     police_station.district_id == selected_district.id
      // );
      // // console.log("selected districts", selected_district);
      setEditPerson({
        ...editPerson,
        district: e.target.value,
        // district_id: Number(selected_district?.id),
      });
    }
  };

  const handlePoliceStationSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    // console.log("e.target.value", e.target.value);
    if (e.target.value) {
      setEditPerson({
        ...editPerson,
        police_station: e.target.value,
        // police_station_id: Number(
        //   police_station_state?.filter(
        //     (police_station: PoliceStation) => police_station.en_name == e.target.value
        //   )[0].id
        // ),
      });
    }
  };

  const handlePostcodeSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    // console.log("e.target.value", e.target.value);
    if (e.target.value) {
      setEditPerson({
        ...editPerson,
        post_office: e.target.value,
        // post_office_id: Number(
        //   post_office_state.filter(
        //     (office: PostOffice) => office.en_name == e.target.value.split("-")[0].trim()
        //   )[0].id
        // ),
      });
    }
  };

  const handleAddressModalOpen = () => {
    setAddressError("");
  };

  const handleZoneSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    return false;
  };

  const handleCountrySelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    return false;
  };

  return (
    <>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={() => onClose(editPerson)}
        scrollBehavior={"outside"}
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
              <form onSubmit={formik.handleSubmit}>
                <ModalHeader className="flex flex-col text-postDark">
                  {
                    addressLocale[
                    `${editPerson.person_type.toLowerCase()}_address` as keyof AddressLocale
                    ]
                  }{" "}
                </ModalHeader>

                <ModalBody>
                  <motion.div
                    className="pb-1"
                    key="name"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.1, delay: 0 }}
                  >
                    <MaterialInput
                      id="name"
                      name="name"
                      whenChange={handleNameChange}
                      whenBlur={formik.handleBlur}
                      value={editPerson.name || ""}
                      error={formik.errors.name || ""}
                      type="text"
                      label={addressLocale.name}
                    />
                  </motion.div>
                  <motion.div
                    className="pb-1"
                    key="title"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.1, delay: 0 }}
                  >
                    <MaterialInput
                      id="title"
                      name="title"
                      whenChange={handleTitleChange}
                      whenBlur={formik.handleBlur}
                      value={editPerson.title || ""}
                      error={formik.errors.title || ""}
                      type="text"
                      label={addressLocale.title}
                    />
                  </motion.div>



                  <>
                    <motion.div
                      className="pb-6"
                      key="district"
                      // transition={{ ease: "easeInOut" }}
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ duration: 0.1, delay: 0.02 }}
                    >
                      <MaterialSelect
                        lang={lang}
                        label={addressLocale.district}
                        id="district"
                        name="district"
                        isDisabled={false}
                        isRequired={false}
                        whenChange={handleDistrictSelectionChange}
                        items={district_state || []}
                        value={
                          editPerson?.district?.length !== 0
                            ? `${editPerson.district}`
                            : ""
                        }
                      />
                    </motion.div>
                    <motion.div
                      className="pb-6"
                      key="police_station"
                      // transition={{ ease: "easeInOut" }}
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ duration: 0.1, delay: 0.04 }}
                    >



                      <MaterialSelect
                        lang={lang}
                        label={addressLocale.subdistrict}
                        id="police_station"
                        name="police_station"
                        isDisabled={editPerson?.district?.length == 0}
                        isRequired={false}
                        whenChange={handlePoliceStationSelectionChange}
                        items={
                          police_station_state || []
                        }
                        value={
                          editPerson?.police_station?.length !== 0
                            ? `${editPerson?.police_station}`
                            : ""
                        }
                      />
                    </motion.div>



                    <motion.div
                      className="pb-6"
                      key="post_office"
                      // transition={{ ease: "easeInOut" }}
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ duration: 0.1, delay: 0.04 }}
                    >
                      <MaterialSelect
                        lang={lang}
                        label={addressLocale.postoffice}
                        id="post_office"
                        name="post_office"
                        isDisabled={editPerson.police_station?.length == 0}
                        isRequired={false}
                        whenChange={handlePostcodeSelectionChange}
                        items={
                          post_office_state || []
                        }
                        value={
                          editPerson?.post_office?.length !== 0
                            ? `${editPerson.post_office}`
                            : ""
                        }
                      />
                    </motion.div>
                  </>

                  <motion.div
                    className="pb-1"
                    key="address"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.1, delay: 0.06 }}
                  >
                    <MaterialTextarea
                      id="address"
                      error={""}
                      isRequired={true}
                      maxLength={200}
                      rows={3}
                      label={`${addressLocale.address} (${addressLocale.address_max}) *`}
                      name="address"
                      value={editPerson.address}
                      whenChange={handleAddressChange}

                    />
                  </motion.div>
                  <motion.div
                    className="pb-1"
                    key="phone"
                    // transition={{ ease: "easeInOut" }}
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.1, delay: 0.08 }}
                  >
                    <>
                      <MaterialInput
                        id="phone"
                        name="phone"
                        whenChange={handlePhoneChange}
                        whenBlur={formik.handleBlur}
                        value={editPerson.phone || ""}
                        error={formik.errors.phone || ""}
                        type="text"
                        label={addressLocale.mobile}
                      />
                    </>
                  </motion.div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => onClose()}

                  >
                    {commonLocale.close}
                  </Button>

                  <Button type="submit" color="success">
                    {commonLocale.ok}
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
