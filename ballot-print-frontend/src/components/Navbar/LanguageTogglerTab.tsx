
'use client'

import { FC, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Locale } from '@/dictionaries/dictionaty'
import Cookies from 'js-cookie'
import { Switch, Tab, Tabs } from '@heroui/react'
type Props = {
    lang: Locale
}

const LanguageTogglerTab: FC<Props> = ({ lang }) => {
    const pathName = usePathname()
    const search = useSearchParams();
    let [language, setLanguage] = useState<React.Key>(lang == "bn" ? "bn" : "en")

    // const toggleLanguage = () => {
    //     let _lang = getInverseLocale(language)
    //     setLanguage(_lang)
    //     Cookies.set('lang', _lang)
    //     window.location.reload();
    // }
    const handleToggleLanguage = (e: React.Key) => {
        console.log("language", e, lang, language)
        if (e == language) {
            console.log("same language", e, lang, language)
            setLanguage(e)
        } else {
            let _language: Locale = language == "bn" ? "en" : "bn"
            let _lang = getInverseLocale(_language)
            setLanguage(_lang)
            Cookies.set('lang', _lang)
            // window.location.reload();
        }

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

                <Tabs color={"warning"} aria-label="Language Type" radius="full" size="sm" onSelectionChange={handleToggleLanguage}>
                    <Tab key="bn" title={"বাংলা"} />
                    <Tab key="en" title={"English"} />
                </Tabs>
            </div>

        </div>
    )
}

export default LanguageTogglerTab