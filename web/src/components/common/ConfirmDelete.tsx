import { Dispatch, FC, SetStateAction } from "react";
import Modal from "./Modal";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "./form/Button";

type props = {
  id: string;
  type: string;
  fn: (id: string) => Promise<number>;
  queryKey: string[];
  setToDelete: Dispatch<SetStateAction<string | undefined>>;
};
const ConfirmDelete: FC<props> = ({ id, type, fn, setToDelete, queryKey }) => {
  const confirm = () => {
    handleDelete(id);
  };

  const close = () => {
    setToDelete(undefined);
  };

  const deleteMutation = useMutation(fn);
  const queryClient = useQueryClient();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess() {
        queryClient.invalidateQueries(queryKey);
        toast.success(`${type} deleted!`);
        setToDelete(undefined);
      },
    });
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={() => setToDelete(undefined)}
        title={`Confirm ${type} deletion`}
        centered={true}
      >
        <div className='w-full flex space-y-6 flex-col'>
          <p className='text-gray-600 text-sm'>
            Are you sure you want to delete this {type} permanently? This action can
            not be undone.
          </p>
          <div className='flex space-x-4'>
            <Button
              onClick={() => close()}
              label='Cancel'
              color='bg-white text-darkblue'
            />
            <Button
              isLoading={deleteMutation.isPending}
              onClick={() => confirm()}
              label='Confirm'
              color='bg-red-500 text-white'
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConfirmDelete;
