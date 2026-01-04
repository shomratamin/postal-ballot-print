import { getDictionary } from "@/dictionaries/dictionaty";
import { get_additional_services } from "@/lib/store/additional_service/actions";
import { PageProps } from "@/lib/store/common/types";
import { get_services } from "@/lib/store/service/actions";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";


export default async function CartsPage({ searchParams }: PageProps) {
    let resolvedSearchParams = await searchParams;
    console.log("id", resolvedSearchParams?.id)
    let lang = await get_lang_cookie()
    const { service, address, common, printing } = await getDictionary(lang)
    const services = await get_services()
    const additional_services = await get_additional_services()
    let verified: VerifiedUser | null = null
    try {
        verified = await verify_cookies()
        // console.log("verified in navbar", verified)
    } catch (err) {
        // console.log("err", err)
        verified = null
    }


    return (
        <div>
            {/* <ProfileComponent
                lang={lang}
                user_id={params.id}
                user={verified}
                serviceLocale={service}
                addressLocale={address}
                printingLocale={printing}
                commonLocale={common}
            /> */}

        </div>
    );
}
