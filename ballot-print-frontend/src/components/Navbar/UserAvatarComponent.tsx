"use client"

import { log_out, logout_user } from "@/lib/store/user/actions";
import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { Avatar, Button, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { redirect, useRouter } from "next/navigation";
import LanguageToggler from "./LanguageToggler";
import { Locale } from "@/dictionaries/dictionaty";
import LanguageTogglerMenu from "./LanguageTogglerMenu";
import LanguageTogglerTab from "./LanguageTogglerTab";
import ThemeTogglerMenu from "./ThemeTogglerMenu";
import { CommonLocale, HomeLocale } from "@/dictionaries/types";

const UserAvatar = ({ user, lang, commonLocale }: { user: VerifiedUser, lang: Locale, commonLocale: CommonLocale }) => {
    const router = useRouter()

    // Function to get all services and roles based on permissions
    const getAllServicesAndRoles = () => {
        if (!user.permissions || user.permissions.length === 0) {
            return [];
        }

        // Filter out dms-core-legacy-sql-query permissions from all processing
        const filteredPermissions = user.permissions.filter(permission =>
            !permission.startsWith('dms-core-legacy-sql-query.')
        );

        const servicesAndRoles: Array<{ service: string; role: string; color: string }> = [];

        // Check for RMS permissions
        const rmsPermissions = filteredPermissions.filter(permission =>
            permission.startsWith('rms.') && (permission.endsWith('.full-permit') || permission.includes('.has-full-permit'))
        );
        rmsPermissions.forEach(permission => {
            const parts = permission.split('.');
            if (parts.length >= 2) {
                const role = parts[1];
                servicesAndRoles.push({
                    service: 'RMS',
                    role: role.charAt(0).toUpperCase() + role.slice(1),
                    color: 'blue'
                });
            }
        });

        // Check for DMS permissions (including dms-accounting)
        const dmsPermissions = filteredPermissions.filter(permission =>
            (permission.startsWith('dms.') || permission.startsWith('dms-accounting.')) &&
            (permission.endsWith('.full-permit') || permission.includes('.has-full-permit'))
        );
        dmsPermissions.forEach(permission => {
            const parts = permission.split('.');
            if (parts.length >= 2) {
                const role = parts[1];
                servicesAndRoles.push({
                    service: 'DMS',
                    role: role.charAt(0).toUpperCase() + role.slice(1),
                    color: 'purple'
                });
            }
        });

        // Check for Ekdak permissions
        const ekdakPermissions = filteredPermissions.filter(permission =>
            permission.startsWith('ekdak.') && (permission.endsWith('.full-permit') || permission.includes('.has-full-permit'))
        );
        ekdakPermissions.forEach(permission => {
            const parts = permission.split('.');
            if (parts.length >= 2) {
                const role = parts[1];
                servicesAndRoles.push({
                    service: 'Ekdak',
                    role: role.charAt(0).toUpperCase() + role.slice(1),
                    color: 'green'
                });
            }
        });

        return servicesAndRoles.length > 0 ? servicesAndRoles : [{ service: 'General', role: 'User', color: 'gray' }];
    }

    const servicesAndRoles = getAllServicesAndRoles();

    const handleLogOut = () => {
        logout_user()
        redirect('/')
    }


    const handleMyCarts = () => {
        router.push("/carts")
    }
    const handleMyOrder = () => {
        router.push("/orders")
    }
    const handleProfileClick = () => {
        let _phone = user.phone
        if (user.phone.includes("+880")) {
            _phone = user.phone.slice(4)
        }

        router.push(`/profile/${_phone}`)
    }
    const handleCartsClick = () => {
        router.push("/carts")
    }
    const handleOrdersClick = () => {
        router.push("/orders")
    }

    return (
        <>

            <Dropdown placement="bottom-end">
                <DropdownTrigger>
                    <Avatar
                        size="sm"
                        as="button"
                        className="transition-transform"
                        src=""
                        classNames={{
                            base: "",
                            img: "",
                            fallback: "",
                            name: "",
                            icon: "text-white",
                        }}
                    />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">

                    <DropdownItem key="legal_name" className="text-postDark dark:text-postLight" textValue="User">
                        <div className="flex flex-col justify-center items-center">
                            <Avatar name={user.username} />
                            <p className="font-semibold text-dark pt-1">{user.username}</p>
                            <p className="font-semibold text-dark">{user.phone}</p>
                            <div className="flex flex-col gap-2 mt-2 max-w-60">
                                {servicesAndRoles.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                                            item.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                                                item.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                                                    'bg-gray-100 dark:bg-gray-900'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${item.color === 'blue' ? 'bg-blue-500' :
                                                item.color === 'purple' ? 'bg-purple-500' :
                                                    item.color === 'green' ? 'bg-green-500' :
                                                        'bg-gray-500'
                                                }`}></div>
                                            <span className={`text-xs font-medium ${item.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                                                item.color === 'purple' ? 'text-purple-700 dark:text-purple-300' :
                                                    item.color === 'green' ? 'text-green-700 dark:text-green-300' :
                                                        'text-gray-700 dark:text-gray-300'
                                                }`}>{item.service} - {item.role}</span>
                                        </div>
                                        {/* <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">{item.role}</span>
                                        </div> */}
                                    </div>
                                ))}
                            </div>

                        </div>

                    </DropdownItem>


                    {/* <DropdownItem key="profile" className="text-postDark dark:text-postLight bg-postLightest dark:bg-postDarker" textValue="Profile" onClick={handleProfileClick}>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <p className="w-full text-md font-bold">{commonLocale.profile}</p>
                        </div>

                    </DropdownItem> */}
                    {/* <DropdownItem key="carts" className="text-postDark dark:text-postLight bg-postLightest dark:bg-postDarker" textValue="Carts" onClick={handleCartsClick}>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                            <p className="w-full text-md font-bold">{commonLocale.carts}</p>
                        </div>

                    </DropdownItem>
                    <DropdownItem key="orders" className="text-postDark dark:text-postLight bg-postLightest dark:bg-postDarker" textValue="Orders" onClick={handleOrdersClick}>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                            <p className="w-full text-md font-bold">{commonLocale.orders}</p>

                        </div>


                    </DropdownItem> */}


                    <DropdownItem key="Language" className="px-2 gap-2 text-postDark dark:text-postLight" textValue="Language">
                        {/* <p className='text-black text-lg dark:text-white text-center'>{lang == "bn" ? "ভাষা" : "Language"}</p> */}
                        <div className="px-2"><LanguageTogglerMenu lang={lang} /></div>

                        {/* <LanguageTogglerTab lang={lang} /> */}
                    </DropdownItem>
                    <DropdownItem key="Theme" className="px-2 gap-2 text-postDark dark:text-postLight" textValue="Theme">
                        {/* <p className='text-lg text-black dark:text-white text-center'>{lang == "bn" ? "থিম" : "Theme"}</p> */}
                        <div className="px-2"><ThemeTogglerMenu lang={lang} /></div>

                        {/* <LanguageTogglerTab lang={lang} /> */}
                    </DropdownItem>
                    <DropdownItem key="logout" className="gap-2 font-semibold text-danger dark:text-postLight" color="danger" textValue="Log Out">
                        <Button className="w-full" color="danger" size="sm" variant="flat" onClick={handleLogOut}>{commonLocale.log_out}</Button>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </>






    );
};

export default UserAvatar;