import { useCallback } from 'react';
import { DedicatedName } from '../types';

interface UseImageUploadProps {
  csvPreview: DedicatedName[];
  csvErrors: string[];
  setCsvPreview: (preview: DedicatedName[] | ((prev: DedicatedName[]) => DedicatedName[])) => void;
  setCsvErrors: (errors: string[]) => void;
}

interface UseImageUploadReturn {
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const useImageUpload = ({
  csvPreview,
  csvErrors,
  setCsvPreview,
  setCsvErrors
}: UseImageUploadProps): UseImageUploadReturn => {

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previewUrls: Record<string, string> = {};
    const newCsvErrors = [...csvErrors];
    const expectedImageNames = csvPreview.map((row, idx) => row.image ? String(row.image).toLowerCase() : null).filter(Boolean);
    const uploadedImageNames = Array.from(files).map(file => file.name.toLowerCase());

    // Check for images not in CSV or not matching assignee name if no image in CSV
    Array.from(files).forEach(file => {
      const fileName = file.name.toLowerCase();
      let matched = false;
      csvPreview.forEach((recipient, idx) => {
        const imageNameInCsv = recipient.image ? String(recipient.image).toLowerCase() : null;
        const assigneeName = recipient.recipient_name ? String(recipient.recipient_name).toLowerCase().replace(/\s+|_/g, '') : null;
        const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+|_/g, '');
        if (imageNameInCsv) {
          // If image name is provided in CSV, only allow exact match
          if (fileName === imageNameInCsv) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newCsvErrors.findIndex(err => err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match'));
            if (rowErrorIdx !== -1) newCsvErrors.splice(rowErrorIdx, 1);
            previewUrls[idx] = URL.createObjectURL(file);
          }
        } else if (assigneeName) {
          // If no image name in CSV, allow if file name matches assignee name
          if (fileNameNoExt === assigneeName) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newCsvErrors.findIndex(err => err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match'));
            if (rowErrorIdx !== -1) newCsvErrors.splice(rowErrorIdx, 1);
            previewUrls[idx] = URL.createObjectURL(file);
          }
        }
      });
      if (!matched) {
        newCsvErrors.push(`Image '${file.name}' does not match any required image name or assignee name in the CSV.`);
      }
    });

    setCsvPreview(prev => prev.map((recipient, idx) => {
      const imageNameInCsv = recipient.image ? String(recipient.image).toLowerCase() : null;
      const assigneeName = recipient.recipient_name ? String(recipient.recipient_name).toLowerCase().replace(/\s+|_/g, '') : null;
      let newImage = recipient.image;
      if (imageNameInCsv) {
        // Find uploaded file with exact name
        const uploadedFile = Array.from(files).find(f => f.name.toLowerCase() === imageNameInCsv);
        if (uploadedFile) {
          newImage = URL.createObjectURL(uploadedFile);
        }
        // else, keep previous image (do not set to undefined)
      } else if (assigneeName) {
        // Find uploaded file matching assignee name
        const uploadedFile = Array.from(files).find(f => f.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+|_/g, '') === assigneeName);
        if (uploadedFile) {
          newImage = URL.createObjectURL(uploadedFile);
        }
        // else, keep previous image (do not set to undefined)
      }
      return { ...recipient, image: newImage };
    }));
    setCsvErrors(newCsvErrors);
  }, [csvPreview, csvErrors, setCsvPreview, setCsvErrors]);

  return {
    handleImageUpload
  };
};