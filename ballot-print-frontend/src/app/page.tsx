import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { Post } from "@/lib/store/post/types";
import { get_post } from "@/lib/store/post/actions";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";
import { checkValidNumber } from "@/lib/utils/CheckValidNumber";
import { initialPost } from "@/lib/store/post/store";
import { get_lang_cookie } from "@/lib/store/user/actions";
import NavBar from "../components/Navbar";
import { PageProps } from "@/lib/store/common/types";

import { get_additional_services } from "@/lib/store/additional_service/actions";
import { get_countries_map, get_zones_map } from "@/lib/store/address/actions";
// import { country_map } from "@/lib/store/address/types";
import { arrayToObjectMap } from "@/lib/store/common/actions";

import { get_services } from "@/lib/store/service/actions";
import { ServiceState } from "@/lib/store/service/types";
import { redirect } from "next/navigation";
// import ServiceCards from "../components/common/Home/ServiceCard";

export default async function Home({ searchParams }: PageProps) {
  let lang: Locale = await get_lang_cookie();
  const services: ServiceState | null = await get_services();
  const additional_services = await get_additional_services();
  const countries = await get_countries_map();
  const zones = await get_zones_map();

  const { validation } = await getDictionary(lang);

  let user: VerifiedUser | null = await verify_cookies();
  let verified = false;
  if (user) {
    verified = true;
    redirect(`/dashboard`)
  } else {
    redirect(`/login`)
  }

  const { login, common, service, home } = await getDictionary(lang);

  let resolvedSearchParams = await searchParams;
  let post: Post;
  const post_id = resolvedSearchParams?.post;
  let has_valid_post = checkValidNumber(post_id);
  if (!post_id || post_id == "new" || !has_valid_post) {
    // console.log("no post id query params", post_id)
    post = initialPost;
  } else {
    // fetch existing post by id
    // console.log("has post id query params layout page", post_id)
    post = await get_post(`${post_id}`);
  }
  // console.log("post in layout page -> ", post)

  return (
    <div className="relative">
      <NavBar />

      <div>
        <div className="w-full flex justify-center items-center">
          <div className="ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px] mb-2">

            {/* <ServiceCards
              lang={lang}
              homeLocale={home}
              authenticated={verified}
              loginLocale={login}
              commonLocale={common}
            /> */}
          </div>


        </div>
      </div>
    </div>

  );
}
