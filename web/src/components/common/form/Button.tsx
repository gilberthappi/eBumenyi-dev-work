import { FC, ReactNode, ReactElement } from "react";
import { Link } from "react-router-dom";

import SyncLoader from "react-spinners/PulseLoader";

interface IButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  label?: string;
  className?: string;
  onClick?: () => void;
  color?: string;
  icon?: ReactElement;
  border?: string;
  to?: string;
  type?: "submit" | "reset" | "button";
  size?: "sm" | "big";
  style?: "outline" | "bg";
}

const Button: FC<IButtonProps> = (props) => {
  let width = "py-2.5 px-4";
  if (props.size == "sm") width = "py-1 px-2 text-xs";

  return (
    <>
      {props.to ? (
        <Link
          to={props.to}
          onClick={() => {
            if (props.onClick) {
              props.onClick();
            }
          }}
          className={`${
            props.className
          } flex justify-center items-center gap-2 rounded-md border ${
            props.border ?? "border-transparent"
          }  ${width} text-sm font-medium shadow-sm focus:ring-2 ${
            props.color
              ? props.color
              : `hover:bg-primary  focus:ring-primary bg-primary text-white`
          } focus:outline-none  outline-none transition-colors duration-300 `}
        >
          {props.isLoading ? (
            <SyncLoader size={8} color='#fff' />
          ) : (
            <>
              {props.icon && <div>{props.icon}</div>}
              <div>
                {props.children ? <>{props.children}</> : <>{props.label}</>}
              </div>
            </>
          )}
        </Link>
      ) : (
        <button
          type={props.type ?? "submit"}
          disabled={props.isLoading || props.disabled}
          onClick={() => {
            if (props.onClick) {
              props.onClick();
            }
          }}
          className={`${
            props.className
          } flex gap-2 justify-center items-center   rounded-md border ${
            props.border ?? "border-transparent"
          }  ${width} text-sm font-medium shadow-sm focus:ring-2 ${
            props.color
              ? props.color
              : `hover:bg-primary  focus:ring-primary bg-primary text-white`
          } focus:outline-none  outline-none transition-colors duration-300 `}
        >
          {props.isLoading ? (
            <SyncLoader size={8} color='#fff' />
          ) : (
            <>
              {props.icon && <div>{props.icon}</div>}
              <div>
                {props.children ? <>{props.children}</> : <>{props.label}</>}
              </div>
            </>
          )}
        </button>
      )}
    </>
  );
};

export default Button;
