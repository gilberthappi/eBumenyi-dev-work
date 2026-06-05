import { FC } from "react";

type props = {
  status: boolean | null;
  trueText?: string;
  falseText?: string;
  big?: boolean;
};
const Status: FC<props> = ({
  status,
  trueText = "Approved",
  falseText = "Declined",
  big = false,
}) => {
  const color =
    status == null //Pending
      ? "202, 138, 4"
      : status == false // Declined
      ? "239, 68, 68"
      : status == true // Approved
      ? "21, 128, 61"
      : "113, 113, 122";

  const style = {
    backgroundColor: `rgba(${color}, 0.1)`,
    color: `rgb(${color})`,
  };
  return (
    <div
      className={`${
        big ? "pt-1 pb-1.5 px-4" : "pt-1 pb-1 px-2.5"
      } bg-opacity-50 rounded text-center inline-block`}
      style={style}
    >
      {status === null ? "Pending" : status === false ? falseText : trueText}
    </div>
  );
};

export default Status;
