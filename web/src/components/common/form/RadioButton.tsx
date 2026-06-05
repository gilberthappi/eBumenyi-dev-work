import { FC } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { generateRandomId } from "../../../constants/helperFunctions";

interface IRadioButton {
  label?: string;
  value?: string;
  register: UseFormRegisterReturn;
  selected?: boolean;
}
const RadioButton: FC<IRadioButton> = ({ label, value, register }) => {
  const uniqueId = `radio-${generateRandomId()}`;
  return (
    <div className='flex items-center space-x-2'>
      <input
        type='radio'
        id={uniqueId}
        {...register}
        defaultValue={value}
        className='h-5 w-5 radio rounded-full cursor-pointer'
      />
      {label && (
        <label
          htmlFor={uniqueId}
          className='text-gray-700 cursor-pointer capitalize'
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default RadioButton;
