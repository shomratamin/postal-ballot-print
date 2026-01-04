import React from 'react'
import Image from "next/image";
import Link from 'next/link';
import { Card } from '@heroui/react';
import { getDictionary } from '@/dictionaries/dictionaty';
import ChangePassForm from '@/src/components/Forms/ChangePassForm';
import { cookies } from 'next/headers';
import { get_lang_cookie } from '@/lib/store/user/actions';

const change_password_otp = async () => {
    let lang = await get_lang_cookie()
    const { login, common } = await getDictionary(lang)
    let cookieStore = await cookies()

    let phone_cookie = cookieStore.get("phone")
    let phone = phone_cookie ? phone_cookie.value : "";


    return (
        <div className="relative w-full flex justify-center items-center overflow-hidden">
            <Card className='m-2 xxs:w-[400px] xs:w-[450px] sm:w-[500px] md:w-[500px] lg:w-[500px]' shadow='lg'>
                <div className="shadow-three px-12 py-16">

                    <div className='mb-3 w-full flex justify-center items-center'>
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
                        {login.title}
                    </h3>
                    <p className="mb-5 text-center text-base font-medium text-black">
                        {login.subtitle}
                    </p>



                    < ChangePassForm lang={lang} loginLocale={login} commonLocale={common} phone={phone} />



                    <div className="text-center text-base font-medium text-body-color">
                        {login.already_using_bangladesh_post}{" "}
                        <Link href={"/login"}>
                            <button className="text-primary hover:underline">
                                {login.login_label}
                            </button>
                        </Link>

                    </div>
                    <p className="text-center text-base font-medium text-dark">
                        {login.no_account_prompt}
                        <Link href={"/signup"}>
                            <span className='inline text-primary cursor-pointer hover:underline'> {login.registration_prompt}</span>
                        </Link>


                    </p>

                </div>
            </Card>
        </div>

    );
};

export default change_password_otp;