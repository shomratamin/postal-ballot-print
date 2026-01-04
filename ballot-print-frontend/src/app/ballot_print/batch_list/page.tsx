import { getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { PageProps } from "@/lib/store/common/types";
import BatchListComponent from "@/src/components/BatchList/BatchListComponent";

export default async function BallotDashboard({ searchParams }: PageProps) {
  let lang = await get_lang_cookie();
  let resolvedSearchParams = await searchParams;
  const { batch_list, dashboard } = await getDictionary(lang);



  return (
    <div>
      <BatchListComponent
        lang={lang}
        batchListLocale={batch_list}
        dashboardLocale={dashboard}
      />
    </div>
  );
}
