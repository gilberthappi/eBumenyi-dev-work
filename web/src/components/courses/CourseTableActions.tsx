import { ICourse } from "@/types";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDelete from "@/components/common/ConfirmDelete";
import { courseKeys } from "@/utils/constants/queryKeys";
import { deleteCourse } from "@/services/course.service";
import DocumentModal from "./DocumentModal";

interface ICourseTableActionsProps {
  item: ICourse;
}

const CourseTableActions: FC<ICourseTableActionsProps> = ({ item }) => {
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<string | undefined>();
  const [showDocs, setShowDocs] = useState(false);

  const handleEdit = () => {
    navigate(`/courses/builder`, {
      state: {
        editCourseId: item.id,
        course: item,
      }
    });
  };



  return (
    <>
        <div className='w-full'>

          <div
            className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
            onClick={handleEdit}
          >
            <PencilIcon className='w-4 text-green' /> Edit
          </div>

          <div
            className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
            onClick={() => setShowDocs(true)}
          >
            <svg className='w-4 h-4 text-blue-600' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M4 4H20V20H4V4Z' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
              <path d='M4 8H20' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
            </svg>
            Documents
          </div>

          {toDelete && (
            <ConfirmDelete
              type='course'
              id={toDelete}
              fn={async (id: string) => {
                await deleteCourse(id);
                return 1;
              }}
              queryKey={[...courseKeys.all]}
              setToDelete={setToDelete}
            />
          )}
          <div
            className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
            onClick={() => setToDelete(item.id)}
          >
            <TrashIcon className='w-4 text-red' /> Delete
          </div>
        </div>

        {showDocs && (
          <DocumentModal
            courseId={item.id}
            isOpen={showDocs}
            onClose={() => setShowDocs(false)}
          />
        )}


    </>
  );
};

export default CourseTableActions;
