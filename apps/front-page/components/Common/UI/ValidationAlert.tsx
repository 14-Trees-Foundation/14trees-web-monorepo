import React from 'react';
import { Modal } from 'ui';
import { ValidationAlertProps } from '../Types/common';

export const ValidationAlert: React.FC<ValidationAlertProps> = ({ 
  show, 
  onClose, 
  title, 
  message 
}) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      showCloseButton
      panelClass="rounded-lg p-6"
    >
      <div className="text-gray-700 p-6">
        {message}
      </div>
    </Modal>
  );
};