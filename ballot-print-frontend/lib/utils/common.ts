import { Locale } from "@/dictionaries/dictionaty"


export function hasPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
}


export const get_translation_service = (label: string, lang: Locale) => {
    if (lang == "bn") {
        switch (label) {
            case "service":
                return "সেবা"

            case "recipient":
                return "প্রাপক"

            case "finalization":
                return "চূড়ান্তকরণ"

            case "payment":
                return "পেমেন্ট"

            case "printing":
                return "প্রিন্টিং"


            default:
                return ""
        }

    } else {
        switch (label) {
            case "service":
                return "Service"

            case "recipient":
                return "Recipient"

            case "finalization":
                return "Finalization"

            case "payment":
                return "Payment"

            case "printing":
                return "Printing"

            default:
                return ""
        }
    }

}