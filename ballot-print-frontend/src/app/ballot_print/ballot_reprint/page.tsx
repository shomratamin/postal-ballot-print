import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { PageProps } from "@/lib/store/common/types";
import BallotReprintComponent from "@/src/components/BallotReprint/BallotReprintComponent";

export default async function BallotDashboard({ searchParams }: PageProps) {
  let lang = await get_lang_cookie();
  let resolvedSearchParams = await searchParams;
  const { reprint_data, dashboard } = await getDictionary(lang);


  return (
    <div>
      <BallotReprintComponent lang={lang} dashboardLocale={dashboard} reprintLocale={reprint_data} />
    </div>
  );
}
