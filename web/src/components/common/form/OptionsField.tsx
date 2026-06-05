import { FC, useEffect } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
interface IOptionFielOption {
  value: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
}
interface IOptionsField {
  label?: string;
  register?: UseFormRegisterReturn;
  error?: string;
  options?: IOptionFielOption[];
  defaultValue?: string;
  value?: string;
  name?: string;
  disabled?: boolean;
  margin?: boolean;
  required?: boolean;
  defaultLabel?: string;
  onChange?: (value: string) => void;
  onValueChage?: (value: string) => void;
  setValue?: (params: string) => void;
  icon?: React.ReactNode;
}
const OptionsField: FC<IOptionsField> = ({
  label,
  options,
  register,
  error,
  defaultValue,
  value,
  name,
  required = true,
  margin = true,
  defaultLabel,
  disabled = false,
  setValue,
  onChange,
  onValueChage,
  icon,
}) => {
  useEffect(() => {
    if (defaultValue?.trim()) {
      if (setValue) {
        setValue(defaultValue);
      }
    }
  }, [defaultValue, setValue]);
  const registerProps = register ?? ({} as UseFormRegisterReturn);
  const { onChange: rhfOnChange, ...restRegister } = registerProps;

  return (
    <div>
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
        <select
          {...restRegister}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            if (rhfOnChange) {
              rhfOnChange(e);
            }
            if (onValueChage) {
              onValueChage(e.target.value);
            }
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          className={`block w-full rounded-md bg-white border-0 py-3 ${
            icon ? "pl-10 pr-10" : "px-2 pr-10"
          } text-gray-900 shadow-sm ring-1 ring-inset focus:ring-1 focus:ring-inset ${
            error
              ? `focus:ring-red-500 ring-red-300`
              : `focus:ring-darkblue ring-gray-200`
          } sm:text-sm sm:leading-6 outline-none`}
          {...(disabled ? { disabled: true } : {})}
        >
          {required ? (
            <option value="" disabled>{defaultLabel ? defaultLabel : "Select one"}</option>
          ) : (
            <option value={""}>{defaultLabel ? defaultLabel : "Select one"}</option>
          )}
          {options?.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <label className='block text-sm leading-6 text-red-500'>{error}</label>
      </div>
    </div>
  );
};
export default OptionsField;
