import { FC, useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface IAutocompleteInput {
  label?: string;
  suggestions: string[];
  register?: UseFormRegisterReturn;
  error?: string;
  value?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  additionalClass?: string;
  name?: string;
}

const AutocompleteInput: FC<IAutocompleteInput> = ({
  label,
  suggestions,
  register,
  error,
  value = "",
  disabled = false,
  onValueChange,
  additionalClass = "",
  name,
}) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <div className='block w-full'>
      {label && (
        <label className='block text-sm font-medium leading-6 text-gray-900'>
          {label}
        </label>
      )}
      <div className='w-full'>
        <input
          {...register}
          type='text'
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`${additionalClass} block w-full rounded-md border-0 py-2 px-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
            error
              ? `focus:ring-red-500 ring-red-300 placeholder:text-red-400`
              : `focus:ring-darkblue ring-gray-300 placeholder:text-gray-400`
          }  sm:text-sm sm:leading-6 outline-none`}
          {...(disabled ? { disabled: true } : {})}
          list={`${name}-suggestions`} // Add list attribute for datalist
        />
        {suggestions.length > 0 && (
          <datalist id={`${name}-suggestions`}>
            {" "}
            {/* Use name prop for unique ID */}
            {suggestions.map((suggestion, index) => (
              <option key={index} value={suggestion} />
            ))}
          </datalist>
        )}
        <label className='block text-sm leading-6 text-red-500'>{error}</label>
      </div>
    </div>
  );
};

export default AutocompleteInput;
