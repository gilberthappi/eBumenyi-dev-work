import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface ITextField {
  label?: string;
  placeholder?: string;
  type: string;
  register?: UseFormRegisterReturn;
  error?: string;
  value?: string;
  defaultValue?: string;
  readonly?: boolean;
  margin?: boolean;
  allowFloats?: boolean;
  disabled?: boolean;
  border?: boolean;
  onValueChange?: (value: string) => void;
  additionalClass?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}

const TextField = React.forwardRef<HTMLInputElement, ITextField>(
  (
    {
      label,
      placeholder,
      type,
      register,
      error,
      value = "",
      defaultValue,
      disabled = false,
      margin = true,
      allowFloats = false,
      onValueChange,
      additionalClass = "",
      onChange,
      icon,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (register?.onChange) {
        register.onChange(e);
      }

      if (onChange) {
        onChange(e);
      }

      if (onValueChange) {
        onValueChange(e.target.value);
      }

      if (onChange) {
        onChange(e);
      }
    };

    const { onChange: registerOnChange, ...registerProps } = register || {};

    return (
      <div className='block w-full'>
        {label && (
          <label className='block capitalize text-sm font-medium leading-6 text-gray-500'>
            {label}
          </label>
        )}
        <div className={`${margin ? "mt-1" : ""} w-full relative`}>
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...registerProps}
            {...props}
            type={type}
            defaultValue={defaultValue || value}
            placeholder={placeholder}
            onChange={handleChange}
            autoComplete={
              type === "email"
                ? "email"
                : type === "password"
                ? "current-password"
                : "on"
            }
            className={`${additionalClass} block w-full rounded-md border-0 py-2.5 ${
              icon ? "pl-10 pr-2.5" : "px-2.5"
            } text-gray-900  ${
              disabled ? "bg-inherit" : "ring-1 ring-inset shadow-sm"
            } focus:ring-1 focus:ring-inset ${
              error
                ? `focus:ring-red-500 ring-red-300 placeholder:text-red-400`
                : `focus:ring-darkblue ring-gray-200 placeholder:text-gray-400`
            }  sm:text-sm sm:leading-6 outline-none min-w-[5rem]`}
            {...(disabled ? { disabled: true } : {})}
            {...(allowFloats ? { step: 0.001 } : {})}
          />
          <label className='block text-sm leading-6 text-red-500'>{error}</label>
        </div>
      </div>
    );
  },
);
TextField.displayName = "TextField";
export default TextField;
