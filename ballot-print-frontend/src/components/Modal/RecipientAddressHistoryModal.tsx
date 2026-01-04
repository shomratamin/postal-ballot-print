import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Selection,
  Tab,
  Tabs,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

import { AddressType, Person, PersonType, address_type_to_post_type } from "@/lib/store/person/types";
import { Locale } from "@/dictionaries/dictionaty";
import AddressCard from "./AddressCard";
import { Post, PostType } from "@/lib/store/post/types";
import {
  Country,
  District,
  PostOffice,
  PoliceStation,
  Zone,
  CountryMap,
  DistrictMap,
  PoliceStationMap,
  PostOfficeMap,
} from "@/lib/store/address/types";
import { INITIAL_RECIPIENT } from "@/lib/store/person/store";
import {
  AddressLocale,
  CommonLocale,
  ValidationLocale,
} from "@/dictionaries/types";
// import { ToastContainer, toast } from "react-toastify";
import { usePersons } from "@/lib/hooks/useFetchPersons";
import PostRecipientNewAddressModal from "./PostRecipientNewAddressModal";
import PostRecipientEditAddressModal from "./PostRecipientEditAddressModal";

export interface AddressHistoryModalProps {
  post: Post;
  person_to_set: Person;
  initialPersonType: PersonType;
  activePersonType: PersonType;
  lang: Locale;
  addressLocale: AddressLocale;
  commonLocale: CommonLocale;
  validationLocale: ValidationLocale;
  isOpen: any;
  countries: Country[];
  countryMap: CountryMap;
  districts: District[];
  policeStations: PoliceStation[];
  postOffices: PostOffice[];
  onHistoryModalClose: (saved: boolean, person: Person | null) => void;
  usePersonAddress: (person: Person) => void;
  updateActivePersonType: (person_type: PersonType) => void;
}



export default function AddressHistoryModal({
  initialPersonType,
  post,
  person_to_set,
  addressLocale,
  districts,
  commonLocale,
  countries,
  countryMap,
  activePersonType,
  policeStations,
  postOffices,
  validationLocale,
  lang,
  isOpen,
  onHistoryModalClose,
  usePersonAddress,
  updateActivePersonType,
}: AddressHistoryModalProps) {
  // if (!Array.isArray(district_state)) {
  //   return <div>Loading...</div>;
  // }

  // // console.log(" previous_persons ==>>", previous_persons);

  const [loading, setLoading] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person>(INITIAL_RECIPIENT);
  const [selectedPerson, setSelectedPerson] = useState<Person>(INITIAL_RECIPIENT);


  const {
    isOpen: isOpenAddAddress,
    onOpen: onOpenAddAddress,
    onClose: onCloseAddAddress,
  } = useDisclosure();

  const {
    isOpen: isOpenEditAddress,
    onOpen: onOpenEditAddress,
    onClose: onCloseEditAddress,
  } = useDisclosure();

  // const notify = () => toast("");

  const setCurrentEditingPerson = (person: Person) => {
    // let editing_person_payload: SetEditingPersonPayload = {
    //   person: person,
    // };
    // dispatch({
    //   type: PostActions.SET_EDITING_PERSON,
    //   payload: editing_person_payload,
    // });
  };


  const { refetch: refetch_persons, data: persons, error: post_state_error, isLoading: post_state_loading, } = usePersons(Cookies.get('access') || "");



  const checkAppropriatePerson = (person: Person, post: Post): boolean => {
    // console.log("person", person);
    // console.log("post", post);
    if (person.address_type && post.type == address_type_to_post_type(person.address_type)) {
      if (person.country_id == post.country_id) {
        return true
      } else {
        return false
      }
    }
    return false
  };

  const handleOpenAddAddress = (person_type: PersonType) => {
    // console.log("handleOpenAddAddress", person_type);
    updateActivePersonType(person_type);
    onOpenAddAddress();
  };

  const handleOpenEditAddress = (person: Person) => {
    setEditingPerson(person);
    // // console.log("handleOpenEditAddress", person);
    updateActivePersonType(person.person_type);
    onOpenEditAddress();
  };

  const useThisPersonAddress = (person: Person) => {
    // // console.log("useThisPersonAddress", person);
    setSelectedPerson(person)
    usePersonAddress(person);
    // setPersons([...persons, { ...person }])

    // onCloseAddAddress();
    // const person_select_res = select_person(session, person)
    // // console.log("person_select_res", person_select_res)

    // onHistoryModalClose(true)
  };

  const handleCloseAddAddress = (added: boolean, person: Person) => {
    // console.log("handleCloseAddAddress", person);
    if (added) {
      usePersonAddress(person);
      setSelectedPerson(person);
      // if (persons && persons.length > 0) {
      //   persons.push(person)
      // }

    }
    refetch_persons()
    onCloseAddAddress();
  };

  const handleCloseEditAddress = (person: Person | null) => {
    // console.log("person", person);
    if (person && person.id) {
      // setPersons(
      //   persons.map((per, index) => {
      //     if (per.id == person.id) {
      //       return {
      //         ...per,
      //         ...person,
      //       };
      //     }
      //     return per;
      //   })
      // );
      refetch_persons()
      usePersonAddress(person);
      setSelectedPerson(person);

    }

    onCloseEditAddress();
  };

  const handleOkClick = () => {
    // console.log("ok clicked", initialPersonType, activePersonType);
    // console.log("ok clicked bool", initialPersonType !== activePersonType);
    // if (initialPersonType !== activePersonType) {
    //   // notify()
    // } else {
    //   onHistoryModalClose(true);
    // }
    onHistoryModalClose(true, selectedPerson);
  };

  const handleSelectionChange = (selection: Selection) => {
    // console.log("selection is", selection);
    let arr_selection = Array.from(selection);
    // console.log("arr_selection is", arr_selection);
    if (arr_selection.length !== 0) {
      if (arr_selection[0] == "1") {
        updateActivePersonType(PersonType["RECIPIENT"]);
      } else if (arr_selection[0] == "2") {
        updateActivePersonType(PersonType["SENDER"]);
      } else if (arr_selection[0] == "3") {
        updateActivePersonType(PersonType["PICKUP"]);
      }
    }
  };



  const countPersons = (person_type: PersonType) => {
    // if (person_type == PersonType["RECIPIENT"]) {
    //   return persons.filter((per) => per.person_type == person_type).length;
    // } else if (person_type == PersonType["SENDER"]) {
    //   return persons.filter((per) => per.person_type == person_type).length;
    // } else if (person_type == PersonType["PICKUP"]) {
    //   return persons.filter((per) => per.person_type == person_type).length;
    // }
  };
  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={() => onHistoryModalClose(false, selectedPerson)}
        scrollBehavior={"inside"}
        radius="sm"
        size="4xl"
        classNames={{
          body: "px-1 sm:px-1 lg:px-6",
          base: "border-dgenLight",
          header: "border-b-1 border-dgenLight",
          footer: "border-t-1 border-dgenLight",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-postDark">
                {addressLocale.prev_address}
              </ModalHeader>

              <ModalBody>
                <div>
                  <div className="flex w-full flex-col">


                    <div>
                      <div className="ss:p-1 sm:p-2 lg:p-3 grid xxs:grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                          onClick={() =>
                            handleOpenAddAddress(PersonType["RECIPIENT"])
                          }
                          className="flex flex-grow"
                        >
                          <Card
                            className="border border-postLight border-dashed cursor-pointer flex-grow"
                            classNames={{
                              base: "rounded-md shadow-none",
                            }}
                          >
                            <CardBody className="flex justify-center items-center">
                              <div className="flex flex-col justify-center items-center">
                                <div>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1}
                                    stroke="currentColor"
                                    className="w-8 h-8"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                  </svg>
                                </div>
                                <p className="text-lg">
                                  {addressLocale.add_address}
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                        </div>

                        {persons && persons
                          .filter(
                            (person) =>
                              person.person_type == PersonType["RECIPIENT"] && checkAppropriatePerson(person, post)
                          )
                          .reverse() // Reverse the order if you're appending new items so newer items are rendered first
                          .map((person) => (
                            <div key={person.id} className="flex flex-grow">
                              {" "}
                              {/* Use person.id for key */}
                              <AddressCard
                                isSelected={person.id === person_to_set.id}
                                person={person}
                                onEditPerson={() =>
                                  handleOpenEditAddress(person)
                                }
                                onUsePerson={() =>
                                  useThisPersonAddress(person)
                                }
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => onHistoryModalClose(false, null)}
                >
                  {commonLocale.close}
                </Button>
                <Button color="success" onPress={handleOkClick}>
                  {commonLocale.ok}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* <ToastContainer /> */}

      <PostRecipientNewAddressModal
        post={post}
        lang={lang}
        countryMap={countryMap}
        addressLocale={addressLocale}
        commonLocale={commonLocale}
        validationLocale={validationLocale}
        countries={countries}
        isOpen={isOpenAddAddress}
        onClose={handleCloseAddAddress}
        personType={activePersonType}
        addressType={post.type == PostType["DOMESTIC"] ? AddressType["DOMESTIC"] : AddressType["INTERNATIONAL"]}
      />
      <PostRecipientEditAddressModal
        post={post}
        lang={lang}
        countries={countries}
        countryMap={countryMap}
        editingPerson={editingPerson}
        isOpen={isOpenEditAddress}
        onClose={handleCloseEditAddress}
        addressLocale={addressLocale}
        commonLocale={commonLocale}
        validationLocale={validationLocale}
        addressType={post.type == PostType["DOMESTIC"] ? AddressType["DOMESTIC"] : AddressType["INTERNATIONAL"]}
      />
    </>
  );
}
