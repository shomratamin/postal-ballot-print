import { getDictionary } from "@/dictionaries/dictionaty";
import fetchUserBranch from "@/lib/http/user/fetchUserBranch";
import { get_lang_cookie } from "@/lib/store/user/actions";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";
import ProfileComponent from "@/src/components/Profile/ProfileComponent";

export default async function UserProfilePage() {
  let lang = await get_lang_cookie();
  const { recipient, address, login, service, bag, validation, profile } = await getDictionary(lang);
  let _user: VerifiedUser | null = await verify_cookies()

  const branch = await fetchUserBranch(_user?.branch_code || "")

  return (
    <div className="flex-1 flex-col ss:p-1 xxs:p-1 sm:px-2 sm:py-1 md:px-2 md:py-1 lg:px-4 lg:py-2">
      <div className="flex ss:flex-col xxs:flex-row xs:flex-row sm:flex-row md:flex-row gap-3 ss:gap-2 xxs:gap-2 xs:gap-3 sm:gap-3 md:gap-4">
        <ProfileComponent user={_user} branch={branch} profileLocale={profile} />
      </div>
    </div>
  );
}
