'use server'

export type Locale = keyof typeof dictionaries

const dictionaries = {
    en: () => import('@/dictionaries/en.json').then((module) => module.default),
    bn: () => import('@/dictionaries/bn.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
    if (locale == "en") return dictionaries.en()
    else return dictionaries.bn()
}



