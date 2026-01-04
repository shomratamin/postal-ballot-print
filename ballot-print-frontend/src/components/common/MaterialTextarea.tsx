"use client"

import { ChangeEvent, FocusEvent } from "react";

const MaterialTextarea = ({
    id,
    name,
    label,
    value,
    error,
    maxLength,
    isRequired,
    rows,
    whenChange,
}: {
    id: string;
    name: string;
    label: string;
    value: string;
    maxLength: number;
    rows: number;
    isRequired: boolean;
    error: string;
    whenChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
    return (
        <div>
            <div className="material-textarea w-full text-postDark dark:text-postLight">
                <textarea
                    required={isRequired}
                    placeholder=" "
                    maxLength={maxLength}
                    className='w-full border-postLight dark:border-postBorderDark rounded-md border-2'
                    id={id}
                    name={name}
                    rows={rows}
                    onChange={(e) => whenChange(e)}
                    value={value}
                />
                <label className="text-xl">{label}</label>

            </div>
            {error && error.length > 0 && <p className="text-sm ml-2 my-2 text-postRed">{error}</p>}
        </div>

    );
};

export default MaterialTextarea;
