import Image from "next/image";
import Link from "next/link";
import React from "react";
import UserAvatarComponent from "./UserAvatarComponent";
import LoginButton from "./LoginButton";
import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";
import { get_lang_cookie, logout_user } from "@/lib/store/user/actions";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  NavbarContent,
  NavbarItem,
  Button,
  Divider,
  Badge,
  Avatar,
} from "@heroui/react";
import LanguageTogglerMenu from "./LanguageTogglerMenu";
import ThemeTogglerMenu from "./ThemeTogglerMenu";
import LoginButtonMenu from "./LoginButtonMenu";
import SignupButtonMenu from "./SignupButtonMenu";
import LogoutButtonMenu from "./LogoutButtonMenu";
// import fetchActiveCart from "@/lib/http/cart/fetchActiveCart";
import SignupButton from "./SignupButton";
import ServiceRoleContent from "./ServiceRoleContent";
import HamBurgerMenu from "./HamBurgerMenu";
import fetchUserBranch from "@/lib/http/user/fetchUserBranch";

export default async function NavBar() {
  let lang: Locale = await get_lang_cookie();
  const { common, login, home } = await getDictionary(lang);
  let verified: VerifiedUser | null = null;
  try {
    verified = await verify_cookies();
    // console.log("verified in navbar", verified)
  } catch (err) {
    // console.log("err", err)
    verified = null;
  }
  const handleNavbarToggle = (isOpen: boolean) => {
    console.log("Navbar menu is now:", isOpen ? "Open" : "Closed");
    return false
  };
  const branch = await fetchUserBranch(verified?.branch_code || "")
  console.log("branch info", branch);
  // const active_cart = await fetchActiveCart();
  // console.log("active_cart", active_cart);

  return (
    <>
      <Navbar isBordered className="bg-postGreen " maxWidth="full">
        <NavbarContent className="lg:hidden flex" justify="start">
          <HamBurgerMenu />
        </NavbarContent>

        <NavbarContent className="sm:hidden w-full" justify="start">
          <NavbarBrand className="w-full ">

            <Link href="/" className={`flex items-center w-full py-3`}>
              <Image
                src="/static/images/logo/logo-icon-dark.svg"
                alt="logo"
                width={40}
                height={30}
                className=""
              />

              <p className="ml-2 w-full text-start ss:text-md xxs:text-md xs:text-xl sm:text-xl md:text-2xl lg:text-2xl text-white dark:text-white">
                {common.logo_text}
              </p>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarBrand className="w-full ">

            <Link href="/" className={`flex items-center  w-full py-3`}>
              <Image
                src="/static/images/logo/logo-icon-dark.svg"
                alt="logo"
                width={40}
                height={30}
                className=""
              />

              <p
                className={`ml-2 w-full text-start ${lang == "bn" ? "ss:text-2xl" : "ss:text-md"
                  } ${lang == "bn" ? "xxs:text-2xl" : "xxs:text-md"} ${lang == "bn" ? "xs:text-2xl" : "xs:text-xl"
                  }  sm:text-xl md:text-2xl lg:text-2xl text-white dark:text-white`}
              >
                {common.logo_text} {branch?.name ? `(${branch.name})` : ""}
              </p>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end">
          {/* <NavbarItem className="hidden sm:flex">
                        <BalanceCurrent />
                    </NavbarItem> */}
          {/* <NavbarItem className="hidden sm:flex">
                        <LanguageToggler lang={lang} />
                    </NavbarItem> */}
          {verified ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 ss:hidden xxs:hidden xs:hidden sm:flex">
                <ServiceRoleContent user={verified} />
              </div>
              <UserAvatarComponent
                commonLocale={common}
                user={verified}
                lang={lang}
              />
            </div>
          ) : (
            <>
              <NavbarItem className="flex">
                <SignupButton btn_name={login.signup}></SignupButton>
              </NavbarItem>
              <NavbarItem>
                <LoginButton btn_name={login.login_label} />
              </NavbarItem>
            </>
          )}
        </NavbarContent>

      </Navbar>

    </>
  );
}
