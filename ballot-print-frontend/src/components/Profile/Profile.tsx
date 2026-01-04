// import {
//     Card,
//     CardHeader,
//     CardFooter,
//     Button,
//     CardBody,
//     Selection,
//     useDisclosure,
//     Avatar,
//     Link,
//     Tabs,
//     Tab,
//     Divider,
// } from "@heroui/react";
// import i18n from '@/i18n';
// import { Player, Controls } from "@lottiefiles/react-lottie-player";
// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useRouter } from "next/router";
// import { EmblaOptionsType } from 'embla-carousel'
// import { useDispatch, useSelector } from "react-redux";
// import { ApplicationState } from "@/store/reducers/rootReducer";
// import LoginModal from "../modal/LoginModal";
// import ComingSoonModal from "../modal/ComingSoonModal";
// import EmblaCarousel from "../Carousal/EmblaCarousel";
// import animationData from '../../public/library/animations/identity_box_animation_2.json';
// import Cookies from 'js-cookie';
// import * as UserActions from '../../store/reducers/user/actionTypes';
// import * as SettingActions from '../../store/reducers/setting/actionTypes';
// import { createAndSubmitForm } from "../Form/LandUser";
// import { useFetchServices } from "@/hooks/useFetchServices";
// import MaterialInput from "../Common/MaterialInput";
// import { motion } from "framer-motion";
// import Image from "next/image";

// export function ProfileComponent() {
//     let user_state = useSelector((state: ApplicationState) => state.user_state);
//     const [animationJson, setAnimationJson] = useState(animationData);
//     const { t } = useTranslation(["home", "common", "service", "login"]);
//     const router = useRouter()
//     const [error, setError] = useState("")
//     const [loading, setLoading] = useState(false)
//     const {
//         isOpen: isloginOpen,
//         onOpen: onloginOpen,
//         onClose: onloginClose,
//     } = useDisclosure();
//     const {
//         isOpen: isComingSoonOpen,
//         onOpen: onComingSoonOpen,
//         onClose: onComingSoonClose,
//     } = useDisclosure();

//     const dispatch = useDispatch()
//     const { data: service_data } = useFetchServices()

//     const setActiveLanguage = (language: string) => {
//         dispatch({ type: SettingActions.SET_ACTIVE_LANGUAGE, payload: { language: language } })
//     }



//     return (
//         <div className="w-full">
//             <div className="relative">
//                 <div className="h-[250px]">
//                     <Card
//                         isFooterBlurred
//                         radius="lg"
//                         className="border-none"
//                     >
//                         <Image
//                             alt="Cover"
//                             className="object-cover"
//                             height={250}
//                             src="/library/banners/banner-online-merchant.svg"
//                             width={800}
//                         />
//                         <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
//                             <div className="w-full flex justify-between">
//                                 <Button className="text-tiny text-postDark bg-black/20 font-bold" variant="flat" color="default" radius="lg" size="sm">
//                                     Mehedi Hasan Adnan
//                                 </Button>
//                                 <Button className="text-tiny text-postDark bg-black/20 font-bold" variant="flat" color="default" radius="lg" size="sm">
//                                     Edit Profile
//                                 </Button>
//                             </div>

//                         </CardFooter>
//                     </Card>
//                 </div>
//                 <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 translate-y-1/2 transform-origin-center z-10">
//                     <Avatar isBordered src="https://i.pravatar.cc/150?u=a04258114e29026708c" className="w-40 h-40 text-large border-white" />
//                 </div>
//             </div>
//             <div className="flex mt-20 gap-3">
//                 <div className="flex w-full flex-col">
//                     <Tabs aria-label="Options" variant="underlined">
//                         <Tab key="photos" title="Photos">
//                             <Card className="mb-3">
//                                 <CardBody>
//                                     Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
//                                 </CardBody>
//                             </Card>
//                             <Card>
//                                 <CardBody>
//                                     Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
//                                 </CardBody>
//                             </Card>
//                         </Tab>
//                         <Tab key="music" title="Music">
//                             <Card>
//                                 <CardBody>
//                                     Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
//                                 </CardBody>
//                             </Card>
//                         </Tab>
//                         <Tab key="videos" title="Videos">
//                             <Card>
//                                 <CardBody>
//                                     Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
//                                 </CardBody>
//                             </Card>
//                         </Tab>
//                     </Tabs>
//                 </div>
//                 <div>
//                     <Card className="max-w-[300px] mt-[52px]">
//                         <CardHeader className="flex gap-3">
//                             <Image
//                                 alt="nextui logo"
//                                 height={40}
//                                 src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
//                                 width={40}
//                             />
//                             <div className="flex flex-col">
//                                 <p className="text-md">NextUI</p>
//                                 <p className="text-small text-default-500">nextui.org</p>
//                             </div>
//                         </CardHeader>
//                         <Divider />
//                         <CardBody>
//                             <p>Make beautiful websites regardless of your design experience.</p>
//                         </CardBody>
//                         <Divider />
//                         <CardFooter>
//                             <Link
//                                 isExternal
//                                 showAnchorIcon
//                                 href="https://github.com/nextui-org/nextui"
//                             >
//                                 Visit source code on GitHub.
//                             </Link>
//                         </CardFooter>
//                     </Card>
//                 </div>
//             </div>

//         </div>
//     );
// }