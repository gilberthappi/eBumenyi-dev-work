import { ReactNode, FC, useEffect } from "react";
import SyncLoader from "react-spinners/PulseLoader";

interface IPageContent {
  title: string;
  actionsComponent?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  hasPadding?: boolean;
  className?: string;
  showHeaderElement?: boolean;
}
const PageContent: FC<IPageContent> = ({
  showHeaderElement = true,
  hasPadding = true,
  ...Props
}) => {
  useEffect(() => {
    document.title = Props.title;
  }, [Props.title]);
  return (
    <>
      <div
        className={
          Props.className ??
          "" + (hasPadding ? "px-4 sm:px-6 lg:px-8 " : "") + " max-w-full"
        }
      >
        {showHeaderElement && (
          <div className='flex items-center justify-between'>
            <div className='flex-auto'>
              <div className='flex gap-5 items-center'>
                <h1 className='text-xl font-semibold text-gray-900'>
                  {Props.title}
                </h1>
              </div>
            </div>
            <div className='flex-none'>
              <div className='flex gap-3'>{Props.actionsComponent}</div>
            </div>
          </div>
        )}
        <div className='mt-8 flex flex-col'>
          <div
            className={
              (Props.className ? Props.className : "") +
              (hasPadding ? ` -my-2 -mx-4 sm:-mx-6 lg:-mx-8` : "")
            }
          >
            <div
              className={
                hasPadding
                  ? "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8"
                  : "w-full"
              }
            >
              {Props.isLoading && (
                <div className='flex justify-center mb-3'>
                  <SyncLoader color='#4d81d2' />
                </div>
              )}
              <div
                className={`${Props.isLoading ? "hidden" : "w-full"} ${
                  Props.className
                }`}
              >
                {Props.children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageContent;
