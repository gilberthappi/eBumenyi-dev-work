import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, UserCheck, FileText, AlertCircle } from "lucide-react";

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3363AD]/10 via-white to-[#3363AD]/5">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              to="/auth/signup"
              className="flex items-center gap-2 text-[#3363AD] hover:text-[#2952] transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Sign Up</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#3363AD] rounded-full flex items-center justify-center">
              <FileText className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Terms and Conditions
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to eBumenyi, a comprehensive learning management system designed for healthcare workers, 
              trainers, and administrators. By accessing or using our platform, you agree to be bound by these 
              Terms and Conditions. Please read them carefully before proceeding.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <div className="flex items-start gap-3">
              <UserCheck className="text-[#3363AD] mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Acceptance of Terms
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By creating an account on eBumenyi, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms and Conditions, as well as our Privacy Policy.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>You must be at least 18 years old to use this platform</li>
                  <li>You must provide accurate and complete registration information</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You agree to notify us immediately of any unauthorized access</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <div className="flex items-start gap-3">
              <Shield className="text-[#3363AD] mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. User Accounts and Responsibilities
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you register for eBumenyi, you will be assigned one of the following roles:
                </p>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">TRAINEE (Community Health Worker)</h3>
                    <p className="text-gray-700 text-sm">
                      Access to training courses, learning materials, certificates, and progress tracking. 
                      Responsible for completing assigned courses and maintaining learning standards.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-2">TRAINER (Supervisor)</h3>
                    <p className="text-gray-700 text-sm">
                      Ability to create and manage courses, monitor trainee progress, provide feedback, 
                      and generate reports. Responsible for ensuring quality training content.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-2">ADMIN</h3>
                    <p className="text-gray-700 text-sm">
                      Full platform access including user management, system configuration, analytics, 
                      and administrative controls. Responsible for platform integrity and compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy and Data Protection */}
          <section>
            <div className="flex items-start gap-3">
              <Lock className="text-[#3363AD] mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Privacy and Data Protection
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are committed to protecting your personal information and privacy:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Your personal data is encrypted and stored securely</li>
                  <li>We collect only necessary information for platform functionality</li>
                  <li>Your data will not be sold or shared with third parties without consent</li>
                  <li>You have the right to access, modify, or delete your personal data</li>
                  <li>We comply with Rwanda's data protection regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use Policy */}
          <section>
            <div className="flex items-start gap-3">
              <Eye className="text-[#3363AD] mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Acceptable Use Policy
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree to use eBumenyi only for lawful purposes and in accordance with these Terms. 
                  You agree NOT to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Transmit any harmful, offensive, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to the platform</li>
                  <li>Interfere with the proper functioning of the platform</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the platform for commercial purposes without authorization</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Intellectual Property Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content on eBumenyi, including courses, materials, logos, and software, is protected 
              by intellectual property rights owned by eBumenyi or its licensors.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-gray-700 text-sm">
                <strong>Note:</strong> You may access and use the content for personal learning purposes only. 
                Reproduction, distribution, or commercial use without written permission is strictly prohibited.
              </p>
            </div>
          </section>

          {/* Course Content and Certificates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Course Content and Certificates
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              eBumenyi provides training courses for healthcare workers across different organizations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Course content is subject to change and updates without prior notice</li>
              <li>Certificates are issued upon successful completion of course requirements</li>
              <li>Certificates are for educational purposes and may be verified by authorized parties</li>
              <li>Organizations (SFH, WELTEL, RBC) may have specific requirements for their trainees</li>
              <li>Completion rates and assessment scores are tracked and reported</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-[#3363AD] mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  eBumenyi is provided "as is" without warranties of any kind. We do not guarantee:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                  <li>Uninterrupted or error-free operation of the platform</li>
                  <li>The accuracy or completeness of any content</li>
                  <li>That the platform will meet your specific requirements</li>
                  <li>Protection against all security vulnerabilities</li>
                </ul>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-gray-700 text-sm">
                    <strong>Important:</strong> eBumenyi shall not be liable for any indirect, incidental, 
                    special, or consequential damages arising from your use of the platform.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time if you violate these 
              Terms and Conditions or engage in activities that harm the platform or other users. Upon 
              termination, your right to access the platform will immediately cease.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms and Conditions from time to time. We will notify you of any 
              material changes by posting the new Terms on this page and updating the "Last updated" date. 
              Your continued use of the platform after such changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of Rwanda. 
              Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the 
              courts of Rwanda.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-[#3363AD]/5 p-6 rounded-lg border border-[#3363AD]/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions or concerns about these Terms and Conditions, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> support@ebumenyi.rw</p>
              <p><strong>Phone:</strong> +250 XXX XXX XXX</p>
              <p><strong>Address:</strong> Kigali, Rwanda</p>
            </div>
          </section>

          {/* Agreement Confirmation */}
          <section className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>By clicking "I agree" during registration, you acknowledge that:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You have read and understood these Terms and Conditions</li>
                <li>You agree to comply with all provisions stated herein</li>
                <li>You understand your rights and responsibilities as a user</li>
                <li>You consent to the collection and use of your data as described</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/auth/signup"
            className="px-8 py-3 bg-[#3363AD] text-white rounded-lg font-medium hover:bg-[#2952] transition-colors text-center"
          >
            I Accept - Continue to Sign Up
          </Link>
          <Link
            to="/auth/login"
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} eBumenyi. All rights reserved.
        </p>
      </div>
    </div>
  );
};
