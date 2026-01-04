import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_additional_services } from "@/lib/store/additional_service/actions";
import { get_countries_map, get_zones_map } from "@/lib/store/address/actions";
import { CountryMap } from "@/lib/store/address/types";
import { arrayToObjectMap, get_menus } from "@/lib/store/common/actions";
import { get_post } from "@/lib/store/post/actions";
import { initialPost } from "@/lib/store/post/store";
import { Post, PostType } from "@/lib/store/post/types";
import { get_services } from "@/lib/store/service/actions";
import { ServiceState } from "@/lib/store/service/types";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { checkValidNumber } from "@/lib/utils/CheckValidNumber";
import { PageProps } from "@/lib/store/common/types";
import { get_persons } from "@/lib/store/person/actions";

export default async function BallotDashboard({ searchParams }: PageProps) {

    let lang = await get_lang_cookie();
    let resolvedSearchParams = await searchParams;
    const { recipient, address, login, service, common, validation } = await getDictionary(lang);

    const services = await get_services();
    const additional_services = await get_additional_services();
    const countries = await get_countries_map();
    const zones = await get_zones_map();
    const persons = await get_persons();

    let post: Post = initialPost;

    // const post_id = resolvedSearchParams?.post;
    // let has_valid_post_id = checkValidNumber(post_id);
    // if (!post_id || post_id == "new" || !has_valid_post_id) {
    //   post = initialPost;
    // } else {
    //   post = await get_post(`${post_id}`);
    // }
    const country_map: CountryMap = await arrayToObjectMap(countries);


    return (
        <div>
            Dashboard

        </div>

    );
}