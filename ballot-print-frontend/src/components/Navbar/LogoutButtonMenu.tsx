"use client"

import { log_out } from "@/lib/store/user/actions";
import { Button } from "@heroui/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";





const LogoutButtonMenu = ({ btn_name }: { btn_name: string }) => {
    const router = useRouter();


    return (
        <Button color="success" size="lg" className="w-full text-white text-md" onPress={() => {
            Cookies.remove("access")
            Cookies.remove("refresh")
            router.push("/login");
        }}>
            <p>{btn_name}</p>

        </Button>
    );
};

export default LogoutButtonMenu;
