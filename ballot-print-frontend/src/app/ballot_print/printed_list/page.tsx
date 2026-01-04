import { getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { PageProps } from "@/lib/store/common/types";
import PrintedListComponent from "@/src/components/PrintLIst/PrintedListComponent";

export default async function BallotDashboard({ searchParams }: PageProps) {
  let lang = await get_lang_cookie();
  let resolvedSearchParams = await searchParams;
  const { printed_list, dashboard } = await getDictionary(lang);


  return (
    <div>
      <PrintedListComponent lang={lang} dashboardLocale={dashboard} printedListLocale={printed_list} />
    </div>
  );
}
