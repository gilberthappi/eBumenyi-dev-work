import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { FC, ReactNode, useState } from "react";
import { usePopper } from "react-popper";

interface ActionsProps {
  children: ReactNode;
}
const TableActions: FC<ActionsProps> = ({ children }) => {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-end", // Adjust placement as needed
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 8], // Adjust the horizontal and vertical offsets as needed
        },
      },
    ],
  });

  return (
    <Popover className='relative'>
      <PopoverButton ref={setReferenceElement} className={"outline-none"}>
        <EllipsisVerticalIcon className='text-primary  w-7 h-7 outline- hover:text-indigo-700' />
      </PopoverButton>
      <PopoverPanel
        style={styles.popper}
        {...attributes.popper}
        ref={setPopperElement}
        className={
          "fixed z-50  border border-gray-100 shadow-lg px-0 rounded-sm w-[140px] bg-white"
        }
      >
        {children}
      </PopoverPanel>
    </Popover>
  );
};
export default TableActions;
