import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import React, { useEffect, useState } from "react";

import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";

import { motion } from "framer-motion";
import {
  AddressType,
  Person,
  PersonStoreRequest,
  PersonType,
} from "@/lib/store/person/types";
import { INITIAL_RECIPIENT, INITIAL_SENDER } from "@/lib/store/person/store";
import { Locale } from "@/dictionaries/dictionaty";
import { Post, PostType } from "@/lib/store/post/types";
import {
  Country,
  District,
  PostOffice,
  PoliceStation,
  Zone,
  DistrictMap,
  PoliceStationMap,
  PostOfficeMap,
  CountryMap,
} from "@/lib/store/address/types";
import MaterialInput from "../common/MaterialInput";
import MaterialSelect, { MaterialSelectItem } from "../common/MaterialSelect";
import MaterialTextarea from "../common/MaterialTextarea";
import { AddressLocale, CommonLocale, ValidationLocale } from "@/dictionaries/types";
import { create_new_person } from "@/lib/store/person/actions";
import { useDistricts } from "@/lib/http/hooks/useFetchDistricts";
import { usePoliceStation } from "@/lib/http/hooks/useFetchPoliceStations";
import { usePostOffice } from "@/lib/http/hooks/usePostOffice";
import { CountryPhoneCodeMap, get_country_map } from "@/lib/store/address/store";
import MaterialPhoneInput from "../common/MaterialPhoneInput";
import { e_to_b, printNumber } from "@/lib/utils/EnglishNumberToBengali";


export interface PostRecipientNewAddressModalProps {
  isOpen: any;
  onClose: any;
  lang: Locale;
  personType: PersonType;
  countries: Country[];
  countryMap: CountryMap;
  addressLocale: AddressLocale;
  commonLocale: CommonLocale;
  validationLocale: ValidationLocale,
  addressType: AddressType;
}



export default function PostRecipientNewAddressModal({ isOpen, onClose, lang, addressLocale, commonLocale, validationLocale, personType, countries, countryMap, addressType }: PostRecipientNewAddressModalProps) {
  const token = Cookies.get("access") || "";
  let [person, setPerson] = useState<Person>({
    ...INITIAL_RECIPIENT,
    person_type: personType,
  });

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = React.useState("");


  let {
    isLoading: isDistrictLoading,
    isFetching: isDistrictFetching,
    isError: isDistrictError,
    data: districts,
    error: districtError,
  } = useDistricts(personType == PersonType["RECIPIENT"] ? "recipient" : "sender", token);
  let {
    isLoading: policeStationLoading,
    isFetching: policeStationFetching,
    isError: isPoliceStationError,
    data: policeStations,
    error: policeStationError,
  } = usePoliceStation(person.district_id || 0, personType == PersonType["RECIPIENT"] ? "recipient" : "sender", token);
  let {
    isLoading: isPostOfficeLoading,
    isFetching: isPostOfficeFetching,
    isError: isPostOfficeError,
    data: postOffices,
    error: postOfficeError,
  } = usePostOffice(person.police_station_id || 0, personType == PersonType["RECIPIENT"] ? "recipient" : "sender", token);

  const formik = useFormik({
    validateOnChange: true,
    initialValues: {
      name: "",
      title: "",
      address: "",
      phone: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().matches(/^[A-Za-z\s]+$/u, validationLocale.only_letter),
      title: Yup.string().matches(
        /^[A-Za-z\s]+$/u,
        validationLocale.only_letter
      ),
      address: Yup.string()
        .max(200, validationLocale.max_letter)
        .required(validationLocale.required_field),
      // phone: Yup.string()
      //   .length(11, validationLocale.length_eleven_digits)
      //   .matches(/^01/, validationLocale.bd_phone)
      //   .matches(/^-?\d+$/, validationLocale.bd_phone),

      phone: Yup.string()
        .test('phone-length', function (value) {
          console.log("value", value)
          if (value && value.length) {
            const countryCode = countryMap[`${person.country_id}`].code; // Assume `countryCode` exists in form values
            console.log("countryCode", countryCode)

            const params = getPhoneValidationParams(countryCode);
            console.log("params", params)

            if (!params) return true; // If no country-specific rules, pass validation

            const { message, phoneLength, min, max, regex } = params;
            console.log("phone value", value)
            console.log("phone value test", regex.test(value))

            // Check dynamic regex
            if (regex && !regex.test(value)) {

              return this.createError({ message: message });
            }
            console.log("message", message)
            if (phoneLength) {
              console.log("phoneLength", phoneLength)
              if (Array.isArray(phoneLength)) {
                console.log("phoneLength is array")
                if (!phoneLength.includes(value.length)) {
                  return this.createError({ message });
                }
              } else {
                console.log("phoneLength is number")
                if (value.length !== phoneLength) {
                  return this.createError({ message });
                }
              }
            } else if (min && max) {
              console.log("no phoneLength has min max")
              if (value.length < min || value.length > max) {
                return this.createError({ message });
              }
            }
            return true;
          }
          else {
            return this.createError({ message: validationLocale.required_field });
          }



        })
    }),
    onSubmit: async (values) => {
      setLoading(true);

      let person_request: PersonStoreRequest = {
        name: person.name,
        title: person.title,
        email: person.email,
        division: person.division,
        division_id: person.division_id,
        district: person.district,
        district_id: person.district_id,
        police_station: person.police_station,
        police_station_id: person.police_station_id,
        post_office: person.post_office,
        post_office_id: person.post_office_id,
        country: isInternational ? person.country : person.country,
        country_id: isInternational ? person.country_id : person.country_id,
        zone: isInternational ? person.zone : person.zone,
        zone_id: isInternational ? person.zone_id : person.zone_id,
        address: person.address,
        start_time: person.start_time,
        end_time: person.end_time,
        phone: person.phone,
        person_type: person.person_type,
        address_type: addressType,
      };

      const result_person = await create_new_person(
        person_request
      );
      if (result_person != null) {
        // console.log("result person from new address modal", result_person);
        onClose(true, result_person);
      }
      setLoading(false);
      // window.location.reload()
    },
  });

  const countryPhoneCodeMap: CountryPhoneCodeMap = get_country_map();
  const contrySelectionRows = countries.map((country) => {
    let selectRow: MaterialSelectItem = {
      id: country.id,
      name: country.name,
      value: country.name,
      code: country.code,
      bn_name: country.bn_name,
      en_name: country.name,
    }
    return selectRow;
  });


  const isInternational = person.address_type == AddressType["INTERNATIONAL"] || addressType == AddressType["INTERNATIONAL"];

  const getPhoneValidationParams = (countryCode: string) => {
    const country = countryPhoneCodeMap[countryCode];
    if (!country) return null;

    let message: string = '';
    if (country.phoneLength && Array.isArray(country.phoneLength)) {
      console.log("country.phoneLength is array", country.phoneLength)
      message = `${validationLocale.must_be} `
      for (let i = 0; i < country.phoneLength.length; i++) {
        message += `${printNumber(lang, country.phoneLength[i])}`
        if (i < country.phoneLength.length - 1) {
          message += `, `
        }
      }
      message += ` ${validationLocale.letters_long}`
    }
    else if (country.phoneLength && !isNaN(country.phoneLength)) {
      console.log("country.phoneLength is number", country.phoneLength)
      message = `${validationLocale.must_be} ${printNumber(lang, country.phoneLength)} ${validationLocale.letters_long}`
    } else if (country.min && country.max) {
      message = `${validationLocale.must_be} ${printNumber(lang, country.min)} ${validationLocale.from} ${printNumber(lang, country.max)} ${validationLocale.letters_long}`
    }

    return {
      message: message,
      phoneLength: country.phoneLength ? country.phoneLength : 0,
      min: country.min ? country.min : 0,
      max: country.max ? country.max : 0,
      regex: new RegExp(`^[0-9]+$`), // Dynamic pattern based on country code prefix
    };
  };


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setPerson({
      ...person,
      name: e.target.value,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);

    setPerson({
      ...person,
      title: e.target.value,
    });
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);

    if (e.target.value.length !== 0) {
      setPerson({
        ...person,
        phone: e.target.value,
      });
    }
  };
  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    formik.handleChange(e);

    if (e.target.value.length !== 0) {
      setPerson({
        ...person,
        address: e.target.value,
      });
    } else {
      setPerson({
        ...person,
        address: "",
      });
    }
  };


  const handleDistrictSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value && districts) {
      let selected_district = districts?.filter(
        (district: MaterialSelectItem) => district.value.toLowerCase().startsWith(e.target.value.toLowerCase())
      )[0];
      let new_person: Person = {
        ...person,
        district: e.target.value,
        district_id: Number(selected_district?.id),
      };
      setPerson(new_person);

      // // console.log("person setting", new_person);
    }
  };


  const handlePoliceStationSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value) {
      setPerson({
        ...person,
        police_station: e.target.value,
        police_station_id: Number(
          policeStations?.filter((police_station: MaterialSelectItem) =>
            police_station.value
              .toLowerCase()
              .startsWith(e.target.value?.toLowerCase())
          )[0].id
        ),
      });
    }
  };

  // const handleRecipientPostOfficeSelectionChange = (
  //   e: React.ChangeEvent<HTMLSelectElement>
  // ) => {
  //   // console.log("e.target.value", e.target.value);
  //   if (e.target.value && recipientPostOffices) {
  //     setRecipient({
  //       ...recipient,
  //       post_office: e.target.value,
  //       post_office_id: Number(
  //         recipientPostOffices.filter(
  //           (office: MaterialSelectItem) =>
  //             office.value.toLowerCase() == e.target.value.toLowerCase()
  //         )[0].id
  //       ),
  //       post_code: Number(
  //         recipientPostOffices.filter(
  //           (office: MaterialSelectItem) =>
  //             office.value.toLowerCase() == e.target.value.toLowerCase()
  //         )[0].code
  //       ),
  //     });
  //   }
  // };

  // const handlePostcodeSelectionChange = (
  //   e: React.ChangeEvent<HTMLSelectElement>
  // ) => {
  //   // console.log("e.target.value", e.target.value);
  //   if (e.target.value) {
  //     setPerson({
  //       ...person,
  //       post_office: e.target.value,
  //       post_office_id: Number(
  //         postOffices.filter(
  //           (office: { en_name: string; }) => office.en_name == e.target.value.split("-")[0].trim()
  //         )[0].id
  //       ),
  //     });
  //   }
  // };

  const handleNewAddressModalClose = () => {
    setPerson({
      ...INITIAL_SENDER,
      person_type: personType,
    });
    onClose(false, {});
  };

  const get_person_type = () => {
    if (personType === PersonType["RECIPIENT"]) {
      return "recipient";
    } else if (personType === PersonType["SENDER"]) {
      return "sender";
    } else if (personType === PersonType["PICKUP"]) {
      return "pickup";
    }
  };

  const handleZoneSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    return false;
  };

  const handleCountrySelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    let selected_country = countries.filter(
      (country) => country.name == e.target.value
    )[0];
    setPerson({
      ...person,
      country: selected_country.name,
      country_id: selected_country.id,
    });
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={handleNewAddressModalClose}
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
                    `${get_person_type()}_address` as keyof AddressLocale
                    ]
                  }{" "}
                </ModalHeader>

                <ModalBody>
                  <div className="text-postDark">
                    <motion.div
                      className="pb-2"
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
                        value={`${person.name}`}
                        error={formik.errors.name || ""}
                        type="text"
                        label={addressLocale.name}
                      />
                    </motion.div>
                    <motion.div
                      className="pb-2"
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
                        value={person.title || ""}
                        error={formik.errors.title || ""}
                        type="text"
                        label={addressLocale.title}
                      />
                    </motion.div>

                    {isInternational ? (
                      <motion.div
                        className="pb-6"
                        key="country"
                        // transition={{ ease: "easeInOut" }}
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ duration: 0.1, delay: 0.04 }}
                      >
                        <MaterialSelect
                          lang={lang}
                          label={
                            addressLocale[
                            `${get_person_type()}_country` as keyof AddressLocale
                            ]
                          }
                          id="country"
                          name="country"
                          isDisabled={false}
                          isRequired={false}
                          whenChange={isInternational ? () => false : handleCountrySelectionChange}
                          items={
                            contrySelectionRows
                          }
                          value={isInternational ? `${person.country}` : (person.country?.length !== 0 ? `${person.country}` : "")}
                        />
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          className="pb-4"
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
                            items={districts || []}

                            value={
                              person.district?.length !== 0
                                ? `${person.district}`
                                : ""
                            }
                          />
                        </motion.div>

                        <motion.div
                          className="pb-4"
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
                            isDisabled={person.district?.length == 0}
                            isRequired={false}
                            whenChange={handlePoliceStationSelectionChange}
                            items={

                              policeStations || []
                            }
                            value={
                              person.police_station?.length !== 0
                                ? `${person.police_station}`
                                : ""
                            }
                          />
                        </motion.div>
                        {/* <motion.div
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
                            isDisabled={person.police_station?.length == 0}
                            isRequired={false}
                            whenChange={handlePostcodeSelectionChange}
                            items={
                              postOffices || []
                            }
                            value={
                              person.post_office?.length !== 0
                                ? `${person.post_office}`
                                : ""
                            }
                          />
                        </motion.div> */}
                      </>
                    )}

                    <motion.div
                      className="pb-2"
                      key="address"
                      // transition={{ ease: "easeInOut" }}
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ duration: 0.1, delay: 0.06 }}
                    >
                      <MaterialTextarea
                        id="recipient-address"
                        error=""
                        isRequired={true}
                        maxLength={200}
                        rows={3}
                        label={`${addressLocale[
                          `${get_person_type()}_country` as keyof AddressLocale
                        ]
                          } ${addressLocale[
                          `${get_person_type()}_address_max` as keyof AddressLocale
                          ]
                          }`}
                        name="address"
                        value={person.address}
                        whenChange={handleAddressChange}
                      />
                    </motion.div>
                    <motion.div
                      className="pb-2"
                      key="number"
                      // transition={{ ease: "easeInOut" }}
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ duration: 0.1, delay: 0.08 }}
                    >
                      {isInternational ?
                        <div className="flex w-full justify-between">
                          <div className="w-[18%]">
                            <MaterialInput
                              id="phone_code"
                              name="phone_code"
                              whenChange={() => { }}
                              whenBlur={() => { }}
                              value={`+${countryPhoneCodeMap[countryMap[`${person.country_id}`].code].phone_code} `}
                              error={""}
                              type="text"
                              label={addressLocale.phone_code}
                            />
                          </div>

                          <div className="w-[81%]">
                            <MaterialPhoneInput
                              id="phone"
                              name="phone"
                              whenChange={handlePhoneChange}
                              whenBlur={formik.handleBlur}
                              value={person.phone || ""}
                              error={formik.errors.phone || ""}
                              type="text"
                              label={
                                addressLocale[
                                `${get_person_type()}_mobile` as keyof AddressLocale
                                ]
                              }
                            />
                          </div>


                        </div>
                        :
                        <>
                          <MaterialInput
                            id="phone"
                            name="phone"
                            whenChange={handlePhoneChange}
                            whenBlur={formik.handleBlur}
                            value={person.phone || ""}
                            error={formik.errors.phone || ""}
                            type="text"
                            label={
                              addressLocale[
                              `${get_person_type()}_mobile` as keyof AddressLocale
                              ]
                            }
                          />
                        </>}

                    </motion.div>
                    <p className="text-sm text-postRed">{phoneError}</p>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    {commonLocale.close}
                  </Button>
                  <Button type="submit" color="success" isLoading={loading}>
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