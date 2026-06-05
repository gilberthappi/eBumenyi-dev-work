import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PropsWithChildren, Fragment } from "react";

interface type {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  desc?: string;
  big?: boolean;
  centered?: boolean;
}

const Modal = (props: PropsWithChildren<type>) => {
  const { isOpen, onClose, desc, title, big, children, centered } = props;
  const width = big ? "w-full max-w-[60rem]" : "w-full max-w-[50rem]";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-50' />
        </Transition.Child>
        <div className='fixed inset-0 overflow-y-auto'>
          <div
            className={`${width} flex ${
              centered ? "items-center" : ""
            } min-h-full items-start justify-center p-4 m-auto`}
          >
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full rounded bg-white px-6 py-6'>
                <div className='flex justify-between'>
                  <div>
                    <Dialog.Title className='font-bold text-lg text-gray-900'>
                      {title}
                    </Dialog.Title>
                    {desc && (
                      <Dialog.Description className='font-medium text-sm text-gray-600'>
                        {desc}
                      </Dialog.Description>
                    )}
                  </div>
                  <div>
                    <XMarkIcon
                      className='w-7 rounded-md bg-gray-200 p-1.5 cursor-pointer'
                      onClick={() => onClose()}
                    />
                  </div>
                </div>

                <div className='pt-6 text-gray-700'>{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
