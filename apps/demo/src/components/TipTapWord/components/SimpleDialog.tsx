import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';

export const SimpleDialog: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
}> = ({ title, description, action, children, visible, onVisibleChange }) => {
  const onClose = () => {
    onVisibleChange(false);
  };
  return (
    <Transition appear show={visible} as={React.Fragment}>
      <Dialog className={'relative z-50'} onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className={'absolute right-6 top-6'}>
                  <button
                    onClick={onClose}
                    className={'transition bg-transparent hover:bg-gray-200 text-gray-600 rounded-full'}
                  >
                    <MdClose className={'w-6 h-6'} />
                  </button>
                </div>
                {title && (
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                )}
                {description && <Dialog.Description>{description}</Dialog.Description>}
                {children}
                {action && <div className="mt-4 flex gap-2">{action}</div>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
