import React from 'react';
import { Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AutoCompleteInput } from '../Common/AutoCompleteInput';

interface EventDetailsSectionProps {
  eventType: string | null;
  eventName: string | null;
  plantedBy: string | null;
  giftedOn: Date | null;
  autoCompleteData: {
    eventNames: string[];
    plantedByNames: string[];
  };
  getOccasionQuestion: () => string;
  onEventTypeChange: (value: string) => void;
  onEventNameChange: (value: string) => void;
  onPlantedByChange: (value: string) => void;
  onGiftedOnChange: (date: Date | null) => void;
  debouncedUpdateAutoComplete: (field: string, value: string) => void;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({
  eventType,
  eventName,
  plantedBy,
  giftedOn,
  autoCompleteData,
  getOccasionQuestion,
  onEventTypeChange,
  onEventNameChange,
  onPlantedByChange,
  onGiftedOnChange,
  debouncedUpdateAutoComplete
}) => {
  return (
    <>
      {/* Occasion Details */}
      <div className="space-y-6 mt-2">
        <h2 className="text-2xl font-semibold">{getOccasionQuestion()}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Occasion Type */}
        <div>
          <label className="block text-base sm:text-lg font-light mb-2">Occasion Type</label>
          <div className="relative">
            <select
              id="eventType"
              name="eventType"
              value={eventType || ""}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="appearance-none w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700 bg-white transition-colors duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
            >
              <option value="" disabled>Select an event type</option>
              <option value="1">Birthday</option>
              <option value="2">Memorial</option>
              <option value="4">Wedding</option>
              <option value="5">Wedding Anniversary</option>
              <option value="6">Festival Celebration</option>
              <option value="7">Retirement</option>
              <option value="3">General Gift</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Occasion Name */}
        <div>
          <label className="block text-base sm:text-lg font-light mb-2">Occasion Name</label>
          <AutoCompleteInput
            name="eventName"
            value={eventName || ""}
            onChange={(e) => {
              onEventNameChange(e.target.value);
              if (e.target.value.trim().length >= 3) {
                debouncedUpdateAutoComplete('eventNames', e.target.value);
              }
            }}
            suggestions={autoCompleteData.eventNames}
            placeholder="Occasion Name"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
          />
        </div>

        {/* Gifted By */}
        <div>
          <label className="block text-base sm:text-lg font-light mb-2">
            Best wishes from
            <Tooltip title="The name(s) of the person(s) gifting." className="ml-1">
              <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
            </Tooltip>
          </label>
          <AutoCompleteInput
            name="plantedBy"
            value={plantedBy || ""}
            onChange={(e) => {
              onPlantedByChange(e.target.value);
              if (e.target.value.trim().length >= 3) {
                debouncedUpdateAutoComplete('plantedByNames', e.target.value);
              }
            }}
            suggestions={autoCompleteData.plantedByNames}
            placeholder="Best wishes from"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
          />
        </div>

        {/* Date of Occasion */}
        <div>
          <label className="block text-base sm:text-lg font-light mb-2">Date of Occasion</label>
          <input
            type="date"
            id="giftedOn"
            name="giftedOn"
            value={giftedOn ? giftedOn.toISOString().split('T')[0] : ""}
            onChange={(e) => onGiftedOnChange(e.target.value ? new Date(e.target.value) : new Date())}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
          />
        </div>
      </div>
    </>
  );
};