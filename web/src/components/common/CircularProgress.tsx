import { CircularProgress } from "@nextui-org/progress";
import { FC } from "react";

type props = {
  strokeWidth?: number;
  indicator?: string;
  track?: string;
  valueColor?: string;
  text: string;
  value: number;
};
const CircularProgressBar: FC<props> = ({
  strokeWidth = 2,
  indicator = "stroke-darkblue",
  valueColor = "text-2xl font-semibold text-gray-900",
  value,
  text,
  track = "stroke-gray-200",
}) => {
  return (
    <div className='border-none'>
      <div className='justify-center items-center pb-0'>
        <CircularProgress
          classNames={{
            svg: `w-32 h-32 drop-shadow-md`,
            indicator: indicator,
            track: track,
            value: valueColor,
          }}
          value={value}
          strokeWidth={strokeWidth}
          showValueLabel={true}
        />
      </div>
      <div className='justify-center items-center pt-4'>
        <div
          className={"border-1 text-gray-900 text-small text-center font-semibold"}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default CircularProgressBar;
