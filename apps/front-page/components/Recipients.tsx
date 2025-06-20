import React, { useEffect, useState } from "react";
import Recipient from "components/Recipient"

interface DedicatedName {
    recipient_name: string;
    recipient_email: string;
    assignee_name: string;
    assignee_email: string;
    trees_count: number;
    [key: string]: string | number | undefined;
}

interface RecipientsProps {
    dedicatedNames: DedicatedName[];
    errors: Record<string, string>;
    formData: { numberOfTrees: string };
    handleNameChange: (index: number, field: keyof DedicatedName, value: string | number) => void;
    handleRemoveName: (index: number) => void;
    handleAddName: () => void;
    setHasAssigneeError: (hasError: boolean) => void;
}

const Recipients: React.FC<RecipientsProps> = ({
    dedicatedNames,
    errors,
    formData,
    handleNameChange,
    handleRemoveName,
    handleAddName,
    setHasAssigneeError,
}) => {

    const [treesCount, setTreesCount] = useState(0);
    const [emailValidationErrors, setEmailValidationErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const cnt = dedicatedNames
            .filter(user => user.recipient_name.trim())
            .map(user => user.trees_count || 1)
            .reduce((prev, count) => prev + count, 0);
        setTreesCount(cnt);
    
        const newErrors: Record<string, string> = {};
        dedicatedNames.forEach((user, i) => {
            const hasRecipientEmail = user.recipient_email?.trim();
            const hasCommEmail = (user as any).recipient_communication_email?.trim();
            const key = `commEmail-${i}`;
            if (!hasRecipientEmail && !hasCommEmail) {
                newErrors[key] = "Please provide at least one email address.";
            }
        });
        setEmailValidationErrors(newErrors);
    }, [dedicatedNames]);

    return (
        <div className="space-y-6" id="gift-recipients">

            {errors["totalTrees"] && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-red-700">{errors["totalTrees"]}</p>
                </div>
            )}

            {dedicatedNames.map((user, index) => {
                return <Recipient
                    key={index}
                    index={index}
                    maxTrees={Number(formData.numberOfTrees) - dedicatedNames.filter((item, idx) => idx != index).map(user => user.trees_count).reduce((prev, curr) => prev + curr, 0)}
                    errors={{ ...errors, ...emailValidationErrors }}
                    user={user}
                    handleNameChange={handleNameChange}
                    handleRemoveName={handleRemoveName}
                    allRecipients={dedicatedNames}
                    setHasAssigneeError={setHasAssigneeError}
                />
            })}

            {/* Add Another Recipient Button */}
            <button
                type="button"
                onClick={handleAddName}
                className={`flex items-center justify-center w-full py-3 border-2 border-dashed rounded-lg mt-4 ${dedicatedNames.some(user => user.recipient_name.trim() === "") ||
                    dedicatedNames.reduce((sum, n) => sum + (Number(n.trees_count) || 0), 0) >=
                    Number(formData.numberOfTrees)
                    ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "border-gray-300 text-green-700 hover:text-green-900 hover:border-green-300 cursor-pointer"
                    }`}
                disabled={
                    dedicatedNames.some(user => user.recipient_name.trim() === "") ||
                    dedicatedNames.reduce((sum, n) => sum + (Number(n.trees_count) || 0), 0) >=
                    Number(formData.numberOfTrees)
                }
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                    />
                </svg>
                Add another recipient
            </button>

            {treesCount != 0 && Number(formData.numberOfTrees) > treesCount && (
                <div className="pt-6">
                    <p className="text-red-600">
                        Only gifting {treesCount} {treesCount == 1 ? "tree" : "trees"} out of {formData.numberOfTrees} trees.
                    </p>
                </div>
            )}

            {treesCount > Number(formData.numberOfTrees) && (
                <div className="pt-6">
                    <p className="text-red-600">
                        You&apos;re currently trying to gift more trees than were originally requested. Please adjust the quantity to proceed.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Recipients;