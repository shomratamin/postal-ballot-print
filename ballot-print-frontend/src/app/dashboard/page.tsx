import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { PageProps } from "@/lib/store/common/types";
import Dashboard from "@/src/components/DashboardComponent/Dashboard";

export default async function BallotDashboard({ searchParams }: PageProps) {

    let lang = await get_lang_cookie();
    let resolvedSearchParams = await searchParams;
    const { dashboard } = await getDictionary(lang);


    return (
        <div>
            <Dashboard dashboardLocale={dashboard} lang={lang} />
        </div>

    );
}