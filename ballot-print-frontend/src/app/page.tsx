import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_lang_cookie } from "@/lib/store/user/actions";
import NavBar from "../components/Navbar";
import { PageProps } from "@/lib/store/common/types";

import { redirect } from "next/navigation";
// import ServiceCards from "../components/common/Home/ServiceCard";

export default async function Home({ searchParams }: PageProps) {
  let lang: Locale = await get_lang_cookie();

  redirect(`/dashboard`);


  return (
    <div className="relative">
      <NavBar />

      <div>
        <div className="w-full flex justify-center items-center">
          <div className="ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px] mb-2">

          </div>
        </div>
      </div>
    </div>
  );
}
