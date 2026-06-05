import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { AuthDecorativePanel } from "@/components/auth/AuthDecorativePanel";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { resetPassword } from "@/services/auth.service";
import toast from "react-hot-toast";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, formData.password);
      toast.success("Password reset successfully!");
      navigate("/auth/login");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#3363AD]/10 via-white to-[#3363AD]/5">
      <AuthDecorativePanel />

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
           <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white text-white">
              <img
                src='/chw.png'
                alt='eBumenyi'
                className='w-40 h-40 object-contain'
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              icon={<Lock size={20} />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              icon={<Lock size={20} />}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Password requirements:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>

            <div className="text-center">
              <Link
                to="/auth/login"
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} eBumenyi. All rights reserved.
        </p>
        </div>
      </div>
    </div>
  );
};
