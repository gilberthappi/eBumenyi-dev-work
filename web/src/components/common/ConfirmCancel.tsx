import { Dispatch, FC, SetStateAction } from "react";
import Modal from "./Modal";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IUUID } from "../../types/common";
import Button from "./form/Button";

type Props = {
  id: string;
  type: string;
  fn: (id: IUUID) => Promise<number>;
  queryKey: string[];
  setOpen: Dispatch<SetStateAction<string | undefined>>;
  title: string;
  message: string;
  confirmText: string;
};

const ConfirmCancel: FC<Props> = ({
  id,
  type,
  fn,
  setOpen,
  queryKey,
  title,
  message,
  confirmText,
}) => {
  const confirm = () => {
    handleAction(id);
  };

  const close = () => {
    setOpen(undefined);
  };

  const actionMutation = useMutation(fn);
  const queryClient = useQueryClient();

  const handleAction = (id: string) => {
    actionMutation.mutate(id, {
      onSuccess() {
        queryClient.invalidateQueries(queryKey);
        toast.success(`${type} updated!`);
        setOpen(undefined);
      },
    });
  };

  return (
    <>
      <Modal isOpen={true} onClose={() => setOpen(undefined)} title={title}>
        <div className='w-full flex space-y-6 flex-col'>
          <p className='text-gray-600 text-sm'>{message}</p>
          <div className='flex space-x-4'>
            <Button
              onClick={() => close()}
              label='Cancel'
              color='bg-white text-darkblue'
            />
            <Button
              isLoading={actionMutation.isPending}
              onClick={() => confirm()}
              label={confirmText}
              color='bg-red-500 text-white'
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConfirmCancel;
