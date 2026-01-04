"use client";
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from "react";
import { EyeIcon } from "./icons/EyeIcon";
import { EyeSlashIcon } from "./icons/EyeSlashIcon";

const MaterialInput = ({
  id,
  name,
  type,
  label,
  value,
  autoComplete,
  autoFocus,
  place_holder,
  error,
  isRequired,
  showClearButton,
  clearInput,
  showPasswordToggle,
  whenChange,
  whenBlur,
  doFocus,
}: {
  id: string;
  name: string;
  type: string;
  place_holder?: string;
  label: string;
  autoFocus?: boolean;
  value: string;
  autoComplete?: string;
  error: string;
  showClearButton?: boolean;
  clearInput?: () => void;
  showPasswordToggle?: boolean;
  isRequired?: boolean;
  whenChange: (e: ChangeEvent<HTMLInputElement>) => void;
  whenBlur: (e: FocusEvent<HTMLInputElement>) => void;
  doFocus?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (doFocus && doFocus > 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [doFocus]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const inputType =
    showPasswordToggle && type === "password"
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

  return (
    <div>
      <div
        className="relative material-textfield w-full text-postDark dark:text-postLight"
        suppressHydrationWarning
      >
        <input
          ref={inputRef}
          placeholder={place_holder || ""}
          type={inputType}
          autoFocus={autoFocus || false}
          className="w-full text-postDark dark:text-postLight border-medium rounded-md border-postLight dark:border-postBorderDark"
          id={id}
          name={name}
          onChange={(e) => whenChange(e)}
          onBlur={(e) => whenBlur(e)}
          value={value}
          autoComplete={autoComplete}
          required={isRequired}
          data-lastpass-icon-root="true"
        />
        <label className="absolute left-2 top-3 transition-all duration-200 text-gray-600 dark:text-postLight">
          {label}
          {isRequired && <span className="text-postRed ml-1">*</span>}
        </label>
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 dark:text-postLight hover:text-postDark dark:hover:text-white transition-colors"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="w-6 h-6" />
            ) : (
              <EyeIcon className="w-6 h-6" />
            )}
          </button>
        )}
        {showClearButton && value.length > 0 && (
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-postRed"
            onClick={clearInput}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm ml-2 my-2 text-postRed">{error}</p>
    </div>
  );
};

export default MaterialInput;
