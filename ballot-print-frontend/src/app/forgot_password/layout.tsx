

import NavBar from "@/src/components/Navbar";

export default async function BookingLayout({
    children
}: {
    children: React.ReactNode
}) {

    return (
        <>
            <NavBar />
            {children}



        </>


    )
}


