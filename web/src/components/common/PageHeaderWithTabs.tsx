import { ReactNode, FC } from "react";
import SyncLoader from "react-spinners/PulseLoader";

interface Tab {
  id: string;
  label: string;
  component: ReactNode;
  roles: string[]; 
  industries?: string[]; 
}

interface IPageHeaderWithTabs {
  title: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actionsComponent?: ReactNode;
  isLoading?: boolean;
  hasPadding?: boolean;
  className?: string;
}

const PageHeaderWithTabs: FC<IPageHeaderWithTabs> = ({
  title,
  tabs,
  activeTab,
  onTabChange,
  actionsComponent,
  isLoading = false,
  hasPadding = true,
  className = "",
}) => {
  const activeTabComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div
      className={`${className} ${
        hasPadding ? "px-4 sm:px-6 lg:px-8" : ""
      } `}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-auto'>
          <div className='flex gap-5 items-center'>
            <h1 className='text-xl font-semibold text-gray-900'>{title}</h1>
          </div>
        </div>
        {actionsComponent && (
          <div className='flex-none'>
            <div className='flex gap-3'>{actionsComponent}</div>
          </div>
        )}
      </div>

      <div className='mt-6'>
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className='mt-6'>
        {isLoading && (
         <div className='flex justify-center mb-3'>
                  <SyncLoader color='#4d81d2' />
                </div>
        )}
        <div className={`${isLoading ? "hidden" : "w-full"}`}>
          {activeTabComponent}
        </div>
      </div>
    </div>
  );
};


// Import reusable tab access utility
// import { isTabAllowed } from "@/utils/tabAccess";

export default PageHeaderWithTabs;
