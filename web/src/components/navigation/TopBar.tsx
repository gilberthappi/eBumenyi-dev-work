import { Bars3BottomLeftIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import DashTop from "../profile/TopUserProfile";
import { useNavigate } from "react-router-dom";

const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const router = useNavigate();

  return (
    <>
      <div className="flex items-center justify-between px-5 py-2 bg-white sticky top-0 z-20 border-b border-dashed">
        {/* Menu Button for Mobile */}
        <button
          className="text-gray-600 md:hidden"
          onClick={onMenuClick}
        >
          <Bars3BottomLeftIcon className="w-6 h-6" />
        </button>

        <div className="flex gap-4 items-center hidden md:flex">
          <span
            className="text-xs flex gap-2 items-center p-2 rounded-md text-gray-700 bg-gray-50 border"
            onClick={() => router(-1)}
          >
            <ChevronLeftIcon className="w-3" />
            Back
          </span>
        </div>

        <div className="flex justify-center w-full md:w-auto md:ml-4">
          <DashTop />
        </div>
      </div>
    </>
  );
};

export default TopBar;
