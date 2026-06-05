import { FC, ReactElement } from "react";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

type TabLinkProps = {
  label?: string;
  icon?: ReactElement;
  bothDirections?: boolean;
  link?: string;
};

const TabLink: FC<TabLinkProps> = ({ label, icon, bothDirections, link }) => {
  const navigate = useNavigate();
  return (
    <>
      <Tab as={Fragment}>
        {({ selected }) => (
          <div
            className={`cursor-pointer flex items-center gap-2 text-sm py-1.5 px-4 mr-2 border-transparent border-2 font-medium outline-none whitespace-nowrap ${
              selected
                ? `text-darkblue ${
                    bothDirections
                      ? "lg:border-l-darkblue lg:border-b-transparent text-left border-b-darkblue"
                      : "border-b-darkblue"
                  } `
                : "text-gray-500"
            }`}
            onClick={() => link && navigate(link)}
          >
            {icon}
            {label}
          </div>
        )}
      </Tab>
    </>
  );
};

export default TabLink;
