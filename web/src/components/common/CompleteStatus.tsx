import { FC } from "react";

type props = {
  status: string | null;
  big?: boolean;
};

const CompleteStatus: FC<props> = ({ status, big = false }) => {
  if (!status) {
    return null;
  }

  const color =
    status === "Pending"
      ? "202, 138, 4"
      : status === "Overdue"
      ? "239, 68, 68"
      : status === "Completed"
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

export default CompleteStatus;
