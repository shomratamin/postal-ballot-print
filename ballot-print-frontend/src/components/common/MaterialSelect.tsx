"use client"

import { Locale } from "@/dictionaries/dictionaty";
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from "react";

export interface MaterialSelectItem {
    id: number;
    value: string;
    name: string;
    bn_name?: string;
    en_name?: string;
    code?: string;
}

const MaterialSelect = ({
    id,
    lang,
    name,
    items,
    label,
    value,
    isRequired,
    isDisabled,
    whenChange,
}: {
    id: string;
    lang: Locale;
    name: string;
    items: MaterialSelectItem[];
    label: string;
    value: string;
    isRequired: boolean;
    isDisabled: boolean;
    whenChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}) => {

    const [selectedValue, setSelectedValue] = useState<string>('');
    const searchStringRef = useRef<string>('');
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();

        // Clear previous timeout
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        // Add the pressed key to the search string
        searchStringRef.current += key;

        // Find the first option that starts with the search string
        const matchingOption = items.find((option: MaterialSelectItem) => {
            if (lang == "bn") {
                return option.name.toLowerCase().startsWith(searchStringRef.current)
            }
            return option.name.toLowerCase().startsWith(searchStringRef.current)
        });

        if (matchingOption) {
            setSelectedValue(matchingOption.value);
        }

        // Reset the search string after a short delay
        timeoutIdRef.current = setTimeout(() => {
            searchStringRef.current = '';
        }, 500); // Adjust the delay as needed (500ms in this example)
    };

    const handleFocus = () => {
        if (selectRef.current) {
            selectRef.current.addEventListener('keydown', handleKeyDown);
        }
    };

    const handleBlur = () => {
        if (selectRef.current) {
            selectRef.current.removeEventListener('keydown', handleKeyDown);
        }
    };

    return (
        <div>
            <div className="material-textfield w-full">
                <div className="material-select text-postDark dark:text-postLight">
                    <select
                        className={`material-select-text border-postLight bg-none dark:border-postBorderDark rounded-md ${isDisabled ? "opacity-50" : ""}`}
                        required={isRequired}
                        id={id}
                        name={name}
                        onChange={whenChange}
                        value={value}
                        disabled={isDisabled}
                        ref={selectRef}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    >
                        <option key="x" value=""></option>
                        {items && items.map((item: MaterialSelectItem) => (
                            <option className="" key={item.id} value={`${item.value}`}>
                                {lang == "bn" ? item.bn_name : (item.name || `${item.en_name}${item.code ? ` - ${item.code}` : ''}`)}
                            </option>
                        ))}

                    </select>
                    <label className="material-select-label text-postDark dark:text-postLight">{label}
                        {isRequired && <span className="text-postRed "> *</span>}



                    </label>
                </div>
            </div>
        </div>
    );
};

export default MaterialSelect;
