import { useState, PropsWithChildren, FC, ReactElement } from "react";
import Modal from "./Modal";
import Button from "./form/Button";

interface type {
  title: string;
  btnLabel?: string;
  btnIcon?: ReactElement;
  big?: boolean;
}

const ModalComponent: FC<PropsWithChildren<type>> = ({
  children,
  title,
  big,
  btnIcon,
  btnLabel,
}) => {
  const [open, setOpen] = useState(false);
  const closeModal = () => {
    setOpen(false);
  };
  return (
    <>
      <div className='flex p-2'>
        <Button
          label={btnLabel}
          icon={btnIcon}
          onClick={() => setOpen(true)}
          border='border border-darkblue'
          color='bg-white text-darkblue'
        />

        <Modal isOpen={open} title={title} onClose={() => closeModal()} big={big}>
          {children}{" "}
        </Modal>
      </div>
    </>
  );
};

export default ModalComponent;
