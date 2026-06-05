import { IHospital } from "@/types";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import ConfirmDelete from "@/components/common/ConfirmDelete";
import { deleteHospital } from "@/services/hospitals.service";

interface IHospitalTableActionsProps {
  item: IHospital;
  onEdit: (hospital: IHospital) => void;
}

const HospitalTableActions: FC<IHospitalTableActionsProps> = ({ item, onEdit }) => {
  const [toDelete, setToDelete] = useState<string | undefined>();

  const handleEdit = () => {
    onEdit(item);
  };

  // Delete function using actual API
  const deleteHospitalFn = async (id: string): Promise<number> => {
    await deleteHospital(id);
    return 1; // Return success indicator
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

        {toDelete && (
          <ConfirmDelete
            type='hospital'
            id={toDelete}
            fn={deleteHospitalFn}
            queryKey={["hospitals"]}
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
    </>
  );
};

export default HospitalTableActions;