import React, { forwardRef, useState, InputHTMLAttributes } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const PasswordField: React.ForwardRefRenderFunction<
  HTMLInputElement,
  PasswordFieldProps
> = function PasswordField({ label, error, icon, ...inputProps }, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = Math.random().toString();
  const errorId = `${inputId}-error`;

  return (
    <div className='relative'>
      <label
        htmlFor={inputId}
        className='block text-sm font-medium leading-6 text-gray-500'
      >
        {label}
      </label>
      <div className='relative mt-1 rounded-md shadow-sm'>
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={`block min-w-full rounded-md border-0 p-2.5 ${
            icon ? "pl-10" : ""
          } pr-10 text-gray-700 shadow-sm ring-1 ring-inset focus:ring-1 focus:ring-inset ${
            error
              ? `focus:ring-red-500 ring-red-300 placeholder:text-red-400`
              : `focus:ring-darkblue ring-gray-200 placeholder:text-gray-400`
          }  sm:text-sm sm:leading-6 outline-none`}
          aria-describedby={error ? errorId : undefined}
        />
        <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='text-sm font-medium text-gray-900'
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className='h-5 w-5 text-gray-400' />
            ) : (
              <EyeIcon className='h-5 w-5 text-gray-400' />
            )}
          </button>
        </div>
      </div>
      {error && (
        <label id={errorId} className='block text-sm leading-6 text-red-500'>
          {error}
        </label>
      )}
    </div>
  );
};

const ForwardedPasswordField = forwardRef(PasswordField);
ForwardedPasswordField.displayName = "PasswordField";

export default ForwardedPasswordField;
