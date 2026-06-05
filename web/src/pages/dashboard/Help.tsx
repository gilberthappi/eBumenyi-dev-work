import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  VideoCameraIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon as ShieldIcon
} from '@heroicons/react/24/outline';

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqCategories = [
    {
      title: "Getting Started",
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: "bg-blue-500",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click on 'Register' from the login page. Fill in your details including your role (Community Health Worker, Trainer, or Admin). You'll receive a confirmation email to activate your account."
        },
        {
          question: "How do I reset my password?",
          answer: "Go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your email to reset your password."
        },
        {
          question: "What roles are available on the platform?",
          answer: "We have three main roles: Community Health Workers (access courses and resources), Trainers (create and manage courses), and Administrators (full system access)."
        }
      ]
    },
    {
      title: "Courses & Learning",
      icon: <BookOpenIcon className="w-6 h-6" />,
      color: "bg-green-500",
      faqs: [
        {
          question: "How do I enroll in a course?",
          answer: "Navigate to the Courses page, browse available courses, and click 'Enroll' on the course you want to take. You'll need to be logged in as a Community Health Worker."
        },
        {
          question: "Can I access courses offline?",
          answer: "Yes, many courses support offline access. Download course materials when online, and you can continue learning without an internet connection."
        },
        {
          question: "How do I track my progress?",
          answer: "Your progress is automatically tracked. Visit 'My Learning' in your dashboard to see completed courses, certificates earned, and current progress."
        },
        {
          question: "How do I get certificates?",
          answer: "Complete all required modules and assessments in a course. Certificates are automatically generated and available in your dashboard."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <ComputerDesktopIcon className="w-6 h-6" />,
      color: "bg-purple-500",
      faqs: [
        {
          question: "The platform isn't loading properly",
          answer: "Try clearing your browser cache and cookies, or try using a different browser. If the issue persists, contact our technical support team."
        },
        {
          question: "I can't upload files or images",
          answer: "Ensure your files are under the size limit (10MB) and in supported formats (PDF, JPG, PNG). Check your internet connection and try again."
        },
        {
          question: "How do I update my profile information?",
          answer: "Go to Settings in your dashboard. You can update your personal information, profile picture, and notification preferences there."
        },
        {
          question: "The mobile app isn't working",
          answer: "Ensure you have the latest version of the app installed. Try restarting your device. If issues continue, reinstall the app."
        }
      ]
    },
    {
      title: "Account & Security",
      icon: <ShieldIcon className="w-6 h-6" />,
      color: "bg-red-500",
      faqs: [
        {
          question: "How do I change my password?",
          answer: "Go to Settings > Security. Click 'Change Password' and follow the prompts. You'll need your current password to make changes."
        },
        {
          question: "I suspect unauthorized access to my account",
          answer: "Immediately change your password and contact our security team. We recommend enabling two-factor authentication for added security."
        },
        {
          question: "How do I enable two-factor authentication?",
          answer: "Visit Settings > Security > Two-Factor Authentication. Follow the setup wizard to link your account with an authenticator app."
        }
      ]
    }
  ];

  const quickAccessItems = [
    {
      title: "User Guide",
      description: "Complete guide to using the platform",
      icon: <DocumentTextIcon className="w-8 h-8" />,
      color: "bg-blue-100 text-blue-600",
      action: "Download PDF"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: <VideoCameraIcon className="w-8 h-8" />,
      color: "bg-green-100 text-green-600",
      action: "Watch Now"
    },
    {
      title: "Live Chat",
      description: "Get instant help from our team",
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8" />,
      color: "bg-purple-100 text-purple-600",
      action: "Start Chat"
    },
    {
      title: "Contact Support",
      description: "Submit a support ticket",
      icon: <EnvelopeIcon className="w-8 h-8" />,
      color: "bg-orange-100 text-orange-600",
      action: "Create Ticket"
    }
  ];

  const contactInfo = [
    {
      method: "Email Support",
      details: "support@chw-platform.rw",
      availability: "24/7",
      icon: <EnvelopeIcon className="w-5 h-5" />
    },
    {
      method: "Phone Support",
      details: "+250 788 123 456",
      availability: "Mon-Fri, 8AM-6PM EAT",
      icon: <PhoneIcon className="w-5 h-5" />
    },
    {
      method: "Emergency Line",
      details: "+250 788 999 999",
      availability: "24/7 for critical issues",
      icon: <ClockIcon className="w-5 h-5" />
    }
  ];

  // Filter FAQs based on search query
  const filteredFAQs = useMemo(() => {
    if (!searchQuery) return faqCategories;

    return faqCategories.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.faqs.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const toggleFAQ = (categoryIndex: number, faqIndex: number) => {
    const uniqueId = categoryIndex * 100 + faqIndex;
    setExpandedFAQ(expandedFAQ === uniqueId ? null : uniqueId);
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions, access resources, and get the help you need to make the most of our platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for help topics, FAQs, or guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickAccessItems.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="p-6">
                <div className={`inline-flex p-3 rounded-lg ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  {item.action}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8 mb-12">
          {filteredFAQs.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="overflow-hidden">
              <div className={`${category.color} text-white p-6`}>
                <div className="flex items-center gap-3">
                  {category.icon}
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const uniqueId = categoryIndex * 100 + faqIndex;
                    const isExpanded = expandedFAQ === uniqueId;

                    return (
                      <div key={faqIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleFAQ(categoryIndex, faqIndex)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <h3 className="text-lg font-medium text-gray-900 pr-4">{faq.question}</h3>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <Card className="mb-12">
          <div className="p-8">
            <div className="text-center mb-8">
              <QuestionMarkCircleIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our support team is here to help. Choose the best way to reach us based on your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactInfo.map((contact, index) => (
                <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                    {contact.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{contact.method}</h3>
                  <p className="text-gray-900 font-medium mb-1">{contact.details}</p>
                  <p className="text-sm text-gray-600">{contact.availability}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" className="mr-4">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" size="lg">
                <EnvelopeIcon className="w-5 h-5 mr-2" />
                Submit Support Ticket
              </Button>
            </div>
          </div>
        </Card>

        {/* System Status */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                <p className="text-gray-600">All systems are operational</p>
              </div>
              <Badge variant="success" className="px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operational
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <ClockIcon className="w-4 h-4 mr-2" />
                Last updated: 2 minutes ago
              </div>
              <div className="flex items-center text-gray-600">
                <ComputerDesktopIcon className="w-4 h-4 mr-2" />
                Platform: Online
              </div>
              <div className="flex items-center text-gray-600">
                <BookOpenIcon className="w-4 h-4 mr-2" />
                Courses: Available
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Under Construction Watermark */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <div className="transform rotate-12 bg-red-500 bg-opacity-20 text-red-800 text-4xl font-bold px-8 py-4 rounded-lg border-2 border-red-500 border-opacity-30">
          UNDER CONSTRUCTION
        </div>
      </div>
    </div>
  );
};

export default Help;