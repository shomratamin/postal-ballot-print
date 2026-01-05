import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_menus } from "@/lib/store/common/actions";

import { get_lang_cookie } from "@/lib/store/user/actions";
import { hasPermission } from "@/lib/utils/common";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";
import NavBar from "@/src/components/Navbar";
import FlowingSidebar from "@/src/components/Sidebar/SidebarResponsive/FlowingSidebar";
import Sidebar, {
  SidebarItem,
} from "@/src/components/Sidebar/SidebarResponsive/sidebar";
import DakjontroBanner from "@/src/components/common/DakjontroBanner";

import { redirect } from "next/navigation";

const ALLOWED = [
  "ADMIN",
  "OPERATOR", "SUPER_ADMIN"
];

export default async function BallotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let lang: Locale = await get_lang_cookie();
  const { common, service, printing } = await getDictionary(lang);
  let user: VerifiedUser | null = await verify_cookies();
  let verified = false;
  if (user) {
    if (ALLOWED.includes(user.user_role)) {
      verified = true
    } else {
      verified = false
      redirect("/login")
    }
  } else {
    redirect("/login");
  }


  let menus: SidebarItem[] = [];
  if (user && user.permissions) {
    menus = await get_menus();
  } else {
    menus = [];
    redirect("/login");
  }
  console.log("menus from dashboard", verified, menus);

  return (
    <div className="relative">
      <NavBar />
      <div className="flex">
        {verified && <FlowingSidebar menus={menus} lang={lang} />}
        <div className="flex flex-col w-full">
          {/* <DakjontroBanner printingLocale={printing} /> */}

          <div className="ss:p-1 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
