import {
  useState,
} from "react";
import {
  LuCirclePlus,
} from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import FilterTabs, { TabItem } from "@/components/ui/FilterTabs";
import CourseList from "@/components/courses/CourseList";
import CreateCourseModal from "@/components/courseBuilder/CreateCourseModal";
import { CourseCreationForm } from "@/types/courseBuilder.d";
import { createCourse } from "@/services/course.service";
import { uploadImage } from "@/services/uploader.api";
import { courseKeys } from "@/utils/constants/queryKeys";

type CreatedCourseDraft = {
  id: string;
  title: string;
  description?: string;
  coverIcon: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type SuperCourseCreateResponse = {
  statusCode: number;
  message: string;
  data?: {
    course?: CreatedCourseDraft;
  };
};


// Utility class for consistent transitions
const transitionClass = "transition-all duration-500 ease-in-out";

const CoursesPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCourseBuilderModal, setShowCourseBuilderModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Define tab items
  const tabItems: TabItem[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
  ];

  // Get filter string based on selected tab
  const getFilterString = (tabKey: string): string => {
    switch (tabKey) {
      case "published":
        return "published";
      case "draft":
        return "draft";
      default:
        return "all";
    }
  };

  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
  };

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
  });

  const uploadCoverIconIfNeeded = async (coverIcon: string): Promise<string> => {
    if (!coverIcon.startsWith("data:image/")) {
      return coverIcon;
    }

    const response = await fetch(coverIcon);
    const blob = await response.blob();
    const fileExtension = blob.type.split("/")[1] || "png";
    const file = new File([blob], `course-icon-${Date.now()}.${fileExtension}`, {
      type: blob.type,
    });

    const uploadResponse = await uploadImage(file);

    if (!uploadResponse.data?.url) {
      throw new Error("Failed to upload course icon");
    }

    return uploadResponse.data.url;
  };

  const handleCourseBuilderSubmit = async (formData: CourseCreationForm) => {
    try {
      const coverIconUrl = await uploadCoverIconIfNeeded(formData.coverIcon);

      const response = (await createCourseMutation.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim(),
        coverIcon: coverIconUrl,
        isPublished: false,
        courseIntro: {
          title: formData.title.trim(),
          summary: formData.description.trim(),
          bannerImage: coverIconUrl,
          thumbnail: coverIconUrl,
        },
        sections: [],
      })) as SuperCourseCreateResponse;

      const createdCourse = response.data?.course;
      if (!createdCourse?.id) {
        throw new Error("Course was created but no course ID was returned");
      }

      await queryClient.invalidateQueries({ queryKey: courseKeys.all });
      setShowCourseBuilderModal(false);

      toast.success("Draft course created");

      navigate("/courses/builder", {
        state: {
          courseForm: {
            ...formData,
            coverIcon: coverIconUrl,
          },
          createdCourse,
        },
      });
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create course";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-[#333333]">Courses</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={"/courses/new"}
              className={`flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white ${transitionClass} hover:bg-[#4d81d2]`}
            >
              <span className="text-xl">
                <LuCirclePlus />
              </span>
              <span>New Course</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowCourseBuilderModal(true)}
              className={`flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white ${transitionClass} hover:bg-[#4d81d2]`}
            >
              <span className="text-xl">🏗️</span>
              <span>Course Builder</span>
            </button>
          </div>
        </div>

        <FilterTabs
          items={tabItems}
          activeTab={selectedTab}
          onTabChange={handleTabChange}
          variant="default"
        />

        <CourseList hideHeader={true} filter={getFilterString(selectedTab)} />
      </div>

      <CreateCourseModal
        isOpen={showCourseBuilderModal}
        onClose={() => setShowCourseBuilderModal(false)}
        onSubmit={handleCourseBuilderSubmit}
      />
    </>
  );
};

export default CoursesPage;