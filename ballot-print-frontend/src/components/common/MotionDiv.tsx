"use client"

import { motion } from "framer-motion"

export default function MotionDiv({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <motion.div
            className='m-1 w-full xxs:px-4 xs:px-4 sm:px-6 md:w-px-8 lg:px-12 py-2 '

            key="booking"
            // transition={{ ease: "easeInOut" }}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}

        >
            {children}
        </motion.div>
    )
}