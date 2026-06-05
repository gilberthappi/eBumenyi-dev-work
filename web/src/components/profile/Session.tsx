/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";

export const Sessions = () => {
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: "MacBook Pro 16-inch",
      location: "Kigali, Rwanda",
      browser: "Chrome 122.0",
      lastActive: "Current session",
      isCurrent: true,
      ip: "192.168.1.100",
    },
    {
      id: 2,
      device: "iPhone 15 Pro",
      location: "Kigali, Rwanda",
      browser: "Safari Mobile",
      lastActive: "2 hours ago",
      isCurrent: false,
      ip: "192.168.1.150",
    },
    {
      id: 3,
      device: "Windows Desktop",
      location: "Kampala, Uganda",
      browser: "Firefox 122.0",
      lastActive: "1 day ago",
      isCurrent: false,
      ip: "102.176.123.45",
    },
    {
      id: 4,
      device: "iPad Air",
      location: "Nairobi, Kenya",
      browser: "Safari Mobile",
      lastActive: "3 days ago",
      isCurrent: false,
      ip: "102.135.67.89",
    },
  ]);

  const handleTerminateSession = (sessionId: any) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  };

  const handleTerminateAllOther = () => {
    setSessions((prev) => prev.filter((session) => session.isCurrent));
  };

  const getDeviceIcon = (device: any) => {
    if (device.includes("iPhone") || device.includes("Android")) return "📱";
    if (device.includes("iPad")) return "📱";
    if (device.includes("MacBook") || device.includes("Mac")) return "💻";
    if (device.includes("Windows")) return "🖥️";
    return "📱";
  };

  return (
    <div className='p-6 bg-white'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <div className='flex justify-between items-start'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Active Sessions
            </h2>
            <p className='text-gray-600'>
              Manage your active sessions across different devices. Terminate
              suspicious sessions for security.
            </p>
          </div>
          <button
            onClick={handleTerminateAllOther}
            className='px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors'
          >
            Terminate All Others
          </button>
        </div>

        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
          <p className='text-blue-800'>
            You have <span className='font-semibold'>{sessions.length}</span> active
            sessions across your devices.
          </p>
        </div>

        <div className='space-y-4'>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-xl p-6 border ${
                session.isCurrent
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              } hover:shadow-lg transition-all duration-200`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-start space-x-4'>
                  <div className='text-3xl'>{getDeviceIcon(session.device)}</div>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {session.device}
                      </h3>
                      {session.isCurrent && (
                        <span className='flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full'>
                          <CheckCircle className='h-4 w-4' />
                          <span className='text-xs font-medium'>
                            Current Session
                          </span>
                        </span>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
                      <div>
                        <span className='font-medium'>Browser:</span>{" "}
                        {session.browser}
                      </div>
                      <div>
                        <span className='font-medium'>Location:</span>{" "}
                        {session.location}
                      </div>
                      <div>
                        <span className='font-medium'>IP Address:</span> {session.ip}
                      </div>
                      <div>
                        <span className='font-medium'>Last Active:</span>{" "}
                        {session.lastActive}
                      </div>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    title='Terminate session'
                  >
                    <Trash2 className='h-5 w-5' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-yellow-900 mb-4'>
            Security Recommendations
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
              <span>Review active sessions regularly</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
              <span>Terminate sessions from unknown locations</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
              <span>Use strong, unique passwords</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
              <span>Enable two-factor authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
