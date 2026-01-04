import { Locale } from "@/dictionaries/dictionaty";


interface EnglishToBanglaNumberMap {
    [key: string]: string;
}

const finalEnglishToBanglaNumber: EnglishToBanglaNumberMap = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
};

export const e_to_b = (englishNumber: string): string => {
    // // console.log("englishNumber", englishNumber)
    let banglaNumber: string = englishNumber;
    for (const x in finalEnglishToBanglaNumber) {
        if (Object.prototype.hasOwnProperty.call(finalEnglishToBanglaNumber, x)) {
            banglaNumber = banglaNumber.replace(new RegExp(x, 'g'), finalEnglishToBanglaNumber[x]);
        }
    }
    // // console.log("banglaNumber", banglaNumber)
    return banglaNumber;
};


export const printNumber = (lang: Locale, number: number) => {
    if (lang == "bn") {
        return e_to_b(`${number}`);
    } else {
        return number;
    }
}
