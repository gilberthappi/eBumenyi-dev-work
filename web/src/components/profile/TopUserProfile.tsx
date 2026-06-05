import { Fragment, ReactNode, useState, useEffect, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useSignOut } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { logout as logoutService } from "@/services/auth.service";
import { Notification } from "@/types";

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashTop() {
  const { user } = useAuth();
  const { photoUrl } = useProfilePhoto();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationsPanelRef = useRef<HTMLDivElement | null>(null);
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { notifications, unreadCount, connected, markAsRead, markAllAsRead } =
    useNotificationsContext();

  const handleLogout = () => {
    signOut();
    logoutService(); // This will redirect to /auth/login
  };

  // Close notifications when clicking outside or pressing Escape
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideBell = bellButtonRef.current?.contains(target);
      const clickedInsidePanel = notificationsPanelRef.current?.contains(target);
      if (!clickedInsideBell && !clickedInsidePanel) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    setShowNotifications(false);
    navigate(`/settings?tab=inbox&id=${notification.id}`);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <>
      <div>
        <div className='flex flex-wrap items-center gap-2 md:gap-4'>
          <Menu as='div' className='relative-'>
            <div className='flex items-center gap-1'>
              {/* Search */}
              <div className='relative w-full md:w-auto ml-8'>
                <Search className='w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
                <input
                  type='text'
                  placeholder='Search...'
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80'
                />
              </div>

              {/* Notifications */}
              <div className='relative'>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  ref={bellButtonRef}
                  className='relative p-2 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <Bell
                    className={`w-5 h-5 ${
                      connected ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                      {unreadCount}
                    </span>
                  )}
                  {!connected && (
                    <span className='absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center'></span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    ref={notificationsPanelRef}
                    className='fixed right-4 md:right-24 top-16 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
                  >
                    <div className='p-4 border-b border-gray-200 flex justify-between items-center'>
                      <h3 className='font-semibold text-gray-900'>Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className='text-xs text-blue-600 hover:text-blue-800 font-medium'
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className='max-h-80 overflow-y-auto'>
                      {notifications.length === 0 ? (
                        <div className='p-8 text-center text-gray-500'>
                          <Bell className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.isRead ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <h4 className='font-medium text-gray-900'>
                                  {notification.title}
                                </h4>
                                <p className='text-sm text-gray-600 mt-1'>
                                  {notification.message}
                                </p>
                                <p className='text-xs text-gray-500 mt-2'>
                                  {notification.createdAt
                                    ? new Date(
                                        notification.createdAt,
                                      ).toLocaleString()
                                    : "Just now"}
                                </p>
                              </div>
                              <div className='flex flex-col items-center space-y-1'>
                                {!notification.isRead && (
                                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                                )}
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    notification.type === "warning"
                                      ? "bg-yellow-500"
                                      : notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "success"
                                      ? "bg-green-500"
                                      : "bg-blue-500"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className='p-4 border-t border-gray-200'>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/settings?tab=inbox");
                        }}
                        className='text-sm text-blue-600 hover:text-blue-800'
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <MenuButton className='flex gap-5 max-w-xs items-center rounded-md text-sm focus:outline-none p-2'>
                <div className='gap-1.5 items-center hidden md:flex max-w-[200px]'>
                  <span className='text-sm font-medium text-gray-700 block truncate' title={user?.fullNames ?? "Admin"}>
                    <span className='sr-only'>Open user menu for </span>
                    <span className='md:block'>
                      Hi, {user?.fullNames ?? "Admin"}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className='h-5 w-5 flex-shrink-0 text-gray-400 lg:block'
                    aria-hidden='true'
                  />
                </div>

                <div>
                  <ProfileAvatar
                    name={`${user?.fullNames || "User"}`}
                    size='w-10 h-6 md:w-8 md:h-8'
                    photo={photoUrl || undefined}
                    rounded={true}
                  />
                </div>
              </MenuButton>
            </div>

            <Transition
              as={Fragment}
              enter='transition ease-out duration-100'
              enterFrom='transform opacity-0 scale-95'
              enterTo='transform opacity-100 scale-100'
              leave='transition ease-in duration-75'
              leaveFrom='transform opacity-100 scale-100'
              leaveTo='transform opacity-0 scale-95'
            >
              <MenuItems className='absolute right-10 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-2xl focus:outline-none'>
                <MenuItem>
                  <Link
                    label='Profile'
                    onClick={() => navigate("/dashboard/profile")}
                    icon={
                      <ProfileAvatar
                        name={`${user?.fullNames || "User"}`}
                        size='w-8 h-8'
                        photo={photoUrl || undefined}
                        rounded={true}
                      />
                    }
                    className='hover:bg-gray-100 transition-colors duration-300 rounded-md'
                  />
                </MenuItem>

                <MenuItem>
                  <Link
                    label='Logout'
                    onClick={() => handleLogout()}
                    icon={<ArrowRightCircleIcon className='w-6 text-gray-700' />}
                    className='hover:bg-gray-100 transition-colors duration-300 rounded-md'
                  />
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
      </div>
    </>
  );
}

const Link = ({
  onClick,
  label,
  icon,
  className,
}: {
  onClick?: () => void;
  label?: string;
  icon: ReactNode;
  className?: string;
}) => {
  return (
    <span
      onClick={() => onClick && onClick()}
      className={classNames(
        "block px-5 md:px-2 py-2.5 text-sm text-gray-700 cursor-pointer",
        className,
      )}
    >
      <span className='flex items-center gap-3'>
        {icon}
        {label && <p className=''>{label}</p>}
      </span>
    </span>
  );
};
