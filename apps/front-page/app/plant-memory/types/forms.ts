import React from 'react';

export interface DedicatedName {
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  recipient_communication_email?: string;
  assignee_name: string;
  assignee_email: string;
  assignee_phone?: string;
  assignee_communication_email?: string;
  relation: string;
  trees_count: number;
  image?: string;
  image_url?: string;
  [key: string]: string | number | undefined;
}



export interface AutoPopulateSettings {
  fullName: boolean;
  email: boolean;
  phone: boolean;
  panNumber: boolean;
  eventName: boolean;
  eventType: boolean;
  plantedBy: boolean;
  primaryMessage: boolean;
  secondaryMessage: boolean;
  recipients: boolean;
}

export interface SavedFormData {
  id: string;
  name: string;
  timestamp: number;
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    panNumber?: string;
    eventName?: string;
    eventType?: string;
    plantedBy?: string;
    primaryMessage?: string;
    secondaryMessage?: string;
    dedicatedNames?: DedicatedName[];
  };
}

export interface AutoCompleteData {
  fullNames: string[];
  emails: string[];
  phones: string[];
  panNumbers: string[];
  eventNames: string[];
  eventTypes: string[];
  plantedByNames: string[];
  primaryMessages: string[];
  secondaryMessages: string[];
}

export interface AutoCompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  pattern?: string;
  title?: string;
}