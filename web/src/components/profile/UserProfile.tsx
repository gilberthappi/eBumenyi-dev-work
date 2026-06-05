/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Upload } from "lucide-react";

const UserProfile = () => {
  const [formData, setFormData] = useState({
    fullNames: "Will Doe",
    email: "willdoe@gmail.com",
    phone: "+250 788 603 376",
    timeZone: "Europe/Rome (GMT+02:00)",
    timeFormat: "Browser Default",
    startOfWeek: "Sunday (Browser Default)",
    language: "Browser Default",
    deleteEmail: "",
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    console.log("Updating profile:", formData);
  };

  const handleDeleteAccount = () => {
    if (formData.deleteEmail === formData.email) {
      console.log("Deleting account");
    } else {
      alert("Please enter your correct email to confirm deletion");
    }
  };

  return (
    <div className='p-6 bg-white'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Profile Account</h2>
          <p className='text-gray-600'>
            Manage your eBumenyi account. All changes in your account will be
            applied to all of your workspace.
          </p>
        </div>

        <div className='bg-gray-50 rounded-xl p-6'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide'>
            Profile Photo
          </h3>
          <div className='flex items-center space-x-6'>
            <div className='w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg'>
              <div className='text-white text-3xl'>🦊</div>
            </div>
            <div className='space-y-2'>
              <button className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
                <Upload className='h-4 w-4' />
                <span>Upload New Photo</span>
              </button>
              <p className='text-xs text-gray-500'>JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>
            Profile Information
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Full Name
              </label>
              <input
                type='text'
                name='fullName'
                value={formData.fullNames}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email Address
              </label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Phome Number
              </label>
              <input
                type='phone'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              />
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>Preferences</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Time Zone
              </label>
              <select
                name='timeZone'
                value={formData.timeZone}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              >
                <option>Europe/Rome (GMT+02:00)</option>
                <option>America/New_York (GMT-05:00)</option>
                <option>Asia/Tokyo (GMT+09:00)</option>
                <option>UTC (GMT+00:00)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Time Format
              </label>
              <select
                name='timeFormat'
                value={formData.timeFormat}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              >
                <option>Browser Default</option>
                <option>12 Hour</option>
                <option>24 Hour</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Start of the Week
              </label>
              <select
                name='startOfWeek'
                value={formData.startOfWeek}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              >
                <option>Sunday (Browser Default)</option>
                <option>Monday</option>
                <option>Saturday</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Language
              </label>
              <select
                name='language'
                value={formData.language}
                onChange={handleInputChange}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
              >
                <option>Browser Default</option>
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
          </div>
        </div>

        <div className='flex justify-start'>
          <button
            onClick={handleUpdate}
            className='px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl'
          >
            Update Profile
          </button>
        </div>

        <div className='bg-red-50 border border-red-200 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-red-900 mb-2'>Delete Account</h3>
          <p className='text-red-700 mb-6'>
            Once you delete your account and account data, there is no going back.
            Please be certain.
          </p>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-red-700 mb-2'>
                Type your email to confirm deletion
              </label>
              <input
                type='email'
                name='deleteEmail'
                value={formData.deleteEmail}
                onChange={handleInputChange}
                placeholder='Enter your email address'
                className='w-full max-w-md px-4 py-3 bg-white border border-red-300 rounded-lg text-gray-900 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all'
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              className='px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors'
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
