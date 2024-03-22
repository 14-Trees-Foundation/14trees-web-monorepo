import { useState } from "react";
import { Dialog } from "@headlessui/react";

type ModalProps = {
  show: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  showCloseButton?: boolean;
  panelClass?: string;
};

export function Modal({
  title,
  show,
  onClose,
  children,
  showCloseButton,
  panelClass,
}: ModalProps) {
  return (
    <Dialog
      open={show}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* The actual dialog panel  */}
        <Dialog.Panel
          className={
            panelClass + " relative mx-auto w-full max-w-lg bg-white shadow-lg"
          }
        >
          <div className="flex items-center justify-between rounded-t-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <button
              className="text-gray-400 hover:text-gray-500 dark:text-gray-200 dark:hover:text-gray-100"
              onClick={() => onClose()}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="">{children}</div>
          {showCloseButton && (
            <div className="flex items-center justify-end rounded-b-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
              <button
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => onClose()}
              >
                Close
              </button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
