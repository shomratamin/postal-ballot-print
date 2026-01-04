"use client"
import { ChangeEvent, FocusEvent } from "react";

const MaterialPhoneInput = ({
    id,
    name,
    type,
    label,
    value,
    autoComplete,
    error,
    whenChange,
    whenBlur,
    isRequired,

}: {
    id: string;
    name: string;
    type: string;
    label: string;
    value: string;
    autoComplete?: string;
    isRequired?: boolean;
    error: string;
    whenChange: (e: ChangeEvent<HTMLInputElement>) => void;
    whenBlur: (e: FocusEvent<HTMLInputElement>) => void;
}) => {

    return (
        <div>
            <div className="material-textfield w-full  text-postDark dark:text-postLight">
                <input
                    placeholder=""
                    type={type}
                    className={`w-full text-postDark dark:text-postLight border-medium rounded-md  border-postLight dark:border-postBorderDark`}
                    id={id}
                    name={name}
                    onChange={(e) => whenChange(e)}
                    onBlur={(e) => whenBlur(e)}
                    value={value}
                    autoComplete={autoComplete}
                    required={isRequired}
                />
                <label className="text-xl text-postDark dark:text-postLight">{label}
                     {isRequired && <span className="text-postRed "> *</span>}
                </label>

            </div>
            <p className="text-sm ml-2 my-2 text-postRed">{error}</p>
        </div>

    );
};

export default MaterialPhoneInput;
