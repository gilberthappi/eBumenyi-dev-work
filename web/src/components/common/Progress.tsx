import { FC } from "react";

type props = {
  max: number;
  value: number;
};

const Progress: FC<props> = ({ max, value }) => {
  const percent = max > 0 ? ((value / max) * 100).toFixed(0) : 0;

  return (
    <div className='w-full max-w-full flex items-center justify-between space-x-1'>
      <div className='w-full h-3'>
        <div className='w-full h-full relative bg-gray-200 rounded-lg'>
          <div
            style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
            className='invisible w-full z-30 absolute font-md text-white flex items-center justify-center'
          >
            {value}
          </div>
          <div
            className='h-full z-10 left-0 top-0 absolute bg-darkblue rounded-lg'
            style={{ width: `${percent}%` }}
          >
            {" "}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Progress;
