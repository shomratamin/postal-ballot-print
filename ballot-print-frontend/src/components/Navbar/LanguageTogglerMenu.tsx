
'use client'

import { FC, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Locale } from '@/dictionaries/dictionaty'
import Cookies from 'js-cookie'
import { Switch } from '@heroui/react'
type Props = {
    lang: Locale
}

const LanguageTogglerMenu: FC<Props> = ({ lang }) => {
    const pathName = usePathname()
    const search = useSearchParams();
    let [language, setLanguage] = useState<Locale>(lang)

    const toggleLanguage = () => {
        let _lang = getInverseLocale(language)
        setLanguage(_lang)
        Cookies.set('lang', _lang)
        window.location.reload();
    }

    const getInverseLocale = (incoming_locale: Locale) => {
        let redirect_locale: Locale = "bn"
        if (incoming_locale == "bn") {
            redirect_locale = "en"
        } else {
            redirect_locale = "bn"
        }
        return redirect_locale
    }

    const getLocaleName = (incoming_locale: Locale) => {
        if (incoming_locale == "bn") {
            return "বাংলা"
        } else {
            return "English"
        }
    }

    return (
        <div className='mt-2 flex justify-between items-center'>

            {/* <p className='text-black text-lg dark:text-white'>{lang == "bn" ? "ভাষা" : "Language"}</p> */}
            <div className="flex justify-center items-center">
                <p
                    className={`mr-4 text-lg font-bold dark:font-normal text-black dark:text-white`}
                >
                    বাংলা
                </p>

                <Switch
                    size='sm'
                    isSelected={language == "en"}
                    onValueChange={toggleLanguage}
                    defaultSelected
                    color="success"
                    classNames={{
                        wrapper: "bg-postGreen",
                    }}
                >
                    <div className="flex items-end ">
                        <p
                            className={`mr-4 text-md font-bold dark:font-normal text-black dark:text-white`}
                        >
                            English
                        </p>
                    </div>
                </Switch>
            </div>

        </div>
    )
}

export default LanguageTogglerMenu