import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { PropsWithChildren, ReactElement } from "react";
import { Link } from "react-router-dom";

export interface BreadCrumbProps {
  links: { to?: string; label: string; Icon?: ReactElement }[];
}

const BreadCrumb = (props: PropsWithChildren<BreadCrumbProps>) => {
  return (
    <div className='w-full flex items-center mt-3 mb-6 space-x-2 relative group'>
      <div>
        <Link to={"/"}>
          <HomeIcon
            className='h-4 w-4 flex-shrink-0 text-gray-400 lg:block'
            aria-hidden='true'
          />
        </Link>
      </div>
      {props.links.map((link, index) => (
        <div className='flex items-center space-x-2' key={index}>
          <div>
            <ChevronRightIcon className='h-3 w-3' />
          </div>
          <div>
            <Link
              to={link.to || ""}
              className={`${
                index == props.links.length - 1
                  ? "disabled text-gray-900  pointer-events-none cursor-default"
                  : "text-gray-500"
              } w-full flex space-1 px-2 py-1 hover:text-gray-900 rounded-md space-5 items-center`}
            >
              {link.Icon && link.Icon}
              <div className='text-sm font-medium'>{link.label}</div>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BreadCrumb;
