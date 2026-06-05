import { FC } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
interface IRadioFielOption {
  value: string;
  label: string;
}
interface IRadioField {
  label: string;
  register?: UseFormRegisterReturn;
  error?: string;
  options: IRadioFielOption[];
}
const RadioField: FC<IRadioField> = ({ label, options, register, error }) => {
  return (
    <div>
      <label className='block text-sm font-medium leading-6 text-gray-900'>
        {label}
      </label>
      <div className='mt-2'>
        <div className='flex gap-4'>
          {options.map((option) => (
            <label key={option.label} className='inline-flex items-center'>
              <input {...register} type='radio' value={option.value} />
              {option.label}
            </label>
          ))}
        </div>
        {error && <p className='text-red-500'>{error}</p>}
      </div>
    </div>
  );
};

export default RadioField;
