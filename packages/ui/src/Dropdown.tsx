import * as React from "react";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
export const DropDown = ({
  main,
  items,
}: {
  main: JSX.Element;
  items: JSX.Element[];
}) => {
  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center gap-x-1">
        {main}
        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
      </Popover.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-1/2 z-20 mt-5 flex max-w-max -translate-x-1/2 px-2">
          <div className="w-screen max-w-sm flex-auto overflow-hidden rounded-2xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
            <div className="p-2">{items}</div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
