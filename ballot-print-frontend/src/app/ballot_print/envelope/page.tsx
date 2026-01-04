import { getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { PageProps } from "@/lib/store/common/types";
import EnvelopeListComponent from "@/src/components/Envelope/EnvelopeListComponent";

export default async function BallotDashboard({ searchParams }: PageProps) {
  let lang = await get_lang_cookie();
  let resolvedSearchParams = await searchParams;
  const { envelope_list, dashboard } = await getDictionary(lang);


  return (
    <EnvelopeListComponent
      lang={lang}
      envelopeListLocale={envelope_list}
      dashboardLocale={dashboard}
    />
  );
}
