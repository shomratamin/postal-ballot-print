"use client"
import { Switch } from "@heroui/react";
import { SunIcon } from "../common/icons/SunIcon";
import { MoonIcon } from "../common/icons/MoonIcon";
import { Locale } from "@/dictionaries/dictionaty";
import { useThemeContext } from "@/src/app/context/theme-context";


const ThemeTogglerMenu = ({ lang }: { lang: Locale }) => {

    const { selectedTheme, toggsetSelectedTheme } = useThemeContext();

    const handleTheme = () => {
        toggsetSelectedTheme()
    }
    // onClick={() => handleTheme(theme === "dark" ? "light" : "dark")}

    return (
        <div className='flex justify-between items-center'>


            <div className="flex justify-center items-center">
                <p
                    className={`mr-4 text-lg font-bold dark:font-normal text-black dark:text-white`}
                >
                    {lang == "bn" ? "লাইট" : "Light"}
                </p>
                <Switch
                    isSelected={selectedTheme === "dark"}
                    size="sm"
                    color="secondary"
                    onValueChange={() => handleTheme()}
                    thumbIcon={({ isSelected, className }) =>
                        isSelected ? (
                            <SunIcon className={className} />
                        ) : (
                            <MoonIcon className={className} />
                        )
                    }
                >
                    {lang == "bn" ? "ডার্ক" : "Dark"}
                </Switch>
                {/* 
                <Switch
                    defaultSelected
                    size="lg"
                    color="success"
                    
                    startContent={<SunIcon />}
                    endContent={<MoonIcon />}
                >

                </Switch> */}
                {/* <Switch
                    isSelected={lang == "bn"}
                    onValueChange={toggleLanguage}
                    defaultSelected
                    color="success"
                    classNames={{
                        wrapper: "bg-postGreen",
                    }}
                >
                    <div className="flex items-end ">
                        <p
                            className={`mr-4 text-lg font-bold dark:font-normal text-black`}
                        >
                            English
                        </p>
                    </div>
                </Switch> */}
            </div>

        </div>
    );
};

export default ThemeTogglerMenu;
