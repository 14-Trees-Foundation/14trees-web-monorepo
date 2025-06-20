import { useState, useEffect } from "react";
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface DedicatedName {
    recipient_name: string;
    recipient_email: string;
    recipient_communication_email?: string;
    assignee_name: string;
    assignee_email: string;
    trees_count: number;
    [key: string]: string | number | undefined;
}

interface RecipeintProps {
    index: number;
    maxTrees: number;
    user: DedicatedName;
    errors: Record<string, string>;
    handleNameChange: (index: number, field: keyof DedicatedName, value: string | number) => void;
    handleRemoveName: (index: number) => void;
    allRecipients: DedicatedName[];
    setHasAssigneeError: (hasError: boolean) => void;
}

const Recipeint: React.FC<RecipeintProps> = ({
    maxTrees,
    index,
    user,
    errors,
    handleNameChange,
    handleRemoveName,
    allRecipients,
    setHasAssigneeError
}) => {
    const [isAssigneeDifferent, setIsAssigneeDifferent] = useState(false);
    const [assigneeError, setAssigneeError] = useState("");
    const [hasTouchedRecipientEmail, setHasTouchedRecipientEmail] = useState(false);
    const [hasTouchedCommEmail, setHasTouchedCommEmail] = useState(false);

    useEffect(() => {
        if (isAssigneeDifferent && !user.assignee_name?.trim()) {
            setAssigneeError("Assignee name is required");
            setHasAssigneeError(true);
        } else {
            setAssigneeError("");
            setHasAssigneeError(false);
        }
    }, [isAssigneeDifferent, user.assignee_name, setHasAssigneeError]);

    const isDuplicateName = (): boolean => {
        const currentName = user.recipient_name.trim().toLowerCase();
        if (!currentName) return false;

        return allRecipients.some((recipient, i) => {
            if (i === index) return false;
            const otherName = recipient.recipient_name.trim().toLowerCase();
            return otherName === currentName;
        });
    };

    const handleRecipientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleNameChange(index, "recipient_name", e.target.value);
    };

    const handleAssigneeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAssigneeDifferent(e.target.checked);
        if (!e.target.checked) {
            handleNameChange(index, "assignee_name", "");
            handleNameChange(index, "assignee_email", "");
        }
    };

    const handleAssigneeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleNameChange(index, "assignee_name", e.target.value);
        if (!e.target.value.trim()) {
            setAssigneeError("Assignee name is required");
            setHasAssigneeError(true);
        } else {
            setAssigneeError("");
            setHasAssigneeError(false);
        }
    };

    return (
        <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">Recipient {allRecipients.length > 1 ? index + 1 : undefined}</h3>
                {index > 0 && (
                    <button
                        type="button"
                        onClick={() => handleRemoveName(index)}
                        className="text-red-600 hover:text-red-800"
                    >
                        Remove
                    </button>
                )}
            </div>

            <div className="relative border space-y-4 p-4 rounded-md mb-4">
                {/* Number of Trees */}
                <div className="flex items-center flex-wrap gap-4">
                    <label className="block text-gray-700 whitespace-nowrap">Number of trees:</label>
                    <div className="flex flex-col gap-1">
                        <input
                            type="number"
                            min="1"
                            max={maxTrees}
                            step="1"
                            className={`w-32 h-10 rounded-md border ${errors[`treeCount-${index}`] ? "border-red-500" : "border-gray-300"} px-4 py-3 text-gray-700`}
                            value={user.trees_count || ""}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                if (inputValue === "" || (/^\d+$/.test(inputValue))) {
                                    const numValue = parseInt(inputValue);
                                    // const clampedValue = Math.max(1, Math.min(numValue, maxTrees));
                                    handleNameChange(index, "trees_count", !isNaN(numValue) ? numValue : 0);
                                }
                            }}
                            onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value) < 1) {
                                    handleNameChange(index, "trees_count", 1);
                                }
                            }}
                            required
                        />
                        {errors[`treeCount-${index}`] && (
                            <p className="text-sm text-red-600">{errors[`treeCount-${index}`]}</p>
                        )}
                    </div>
                </div>

                {/* Recipient Name */}
                <div>
                    <label className="block text-gray-700 mb-1">
                        Recipient name:
                        <Tooltip title="The one who receives the card. There may be multiple recipients.">
                            <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help ml-1" />
                        </Tooltip>
                    </label>
                    <input
                        type="text"
                        placeholder="The one who receives the card"
                        className={`w-full rounded-md border ${errors[`dedicatedName-${index}`] ? "border-red-500" : "border-gray-300"} px-4 py-3 text-gray-700`}
                        value={user.recipient_name}
                        onChange={handleRecipientNameChange}
                    />
                    {errors[`dedicatedName-${index}`] ? (
                        <p className="mt-1 text-sm text-red-600">{errors[`dedicatedName-${index}`]}</p>
                    ) : isDuplicateName() ? (
                        <p className="mt-1 text-sm text-red-600">Recipient name must be unique</p>
                    ) : null}
                </div>

                {/* Recipient Email */}
                <div>
                    <label className="block text-gray-700 mb-1">Recipient email ID:</label>
                    <input
                        type="email"
                        placeholder="Type Recipient's email"
                        className={`w-full rounded-md border ${errors[`dedicatedEmail-${index}`] ? "border-red-500" : "border-gray-300"} px-4 py-3 text-gray-700`}
                        value={user.recipient_email}
                        onChange={(e) => handleNameChange(index, "recipient_email", e.target.value)}
                        onBlur={() => setHasTouchedRecipientEmail(true)}
                    />
                    {errors[`dedicatedEmail-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`dedicatedEmail-${index}`]}</p>
                    )}
                </div>

                {/* Recipient Communication Email */}
                <div className="mt-4">
                    <label className="block text-gray-700 mb-1">
                    Recipient Communication email:
                        <Tooltip title="Provide this if the recipient doesn't have an email. This will be used for tree updates.">
                            <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help ml-1" />
                        </Tooltip>
                    </label>
                    <input
                        type="email"
                        placeholder="Enter communication email"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                        value={user.recipient_communication_email || ""}
                        onChange={(e) => handleNameChange(index, "recipient_communication_email", e.target.value)}
                        onBlur={() => setHasTouchedCommEmail(true)}
                    />
                </div>
            </div>
            {/* Assignee Section */}
            {/* <div className="mt-4 pt-4 border-t">
                <label className="flex items-center space-x-3 mb-4">
                    <input
                        type="checkbox"
                        checked={isAssigneeDifferent}
                        onChange={handleAssigneeToggle}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">Assign trees to someone else?</span>
                </label>

                {isAssigneeDifferent && (
                    <div className="border border-gray-200 rounded-md p-4 space-y-4 bg-gray-50">
                        <h3 className="font-medium text-gray-700">
                            Assignee Details
                            <Tooltip title="The tree is planted in this person's name.">
                               <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help ml-1" />
                            </Tooltip>
                        </h3>
                        <div>
                            <input
                                type="text"
                                placeholder="The tree is planted in this person's name *"
                                value={user.assignee_name}
                                onChange={handleAssigneeNameChange}
                                className={`w-full rounded-md border ${
                                    assigneeError ? "border-red-500" : "border-gray-300"
                                } px-4 py-3 text-gray-700`}
                                required
                            />
                            {assigneeError && (
                                <p className="mt-1 text-sm text-red-600">{assigneeError}</p>
                            )}
                        </div>
                        <div>
                        <input
                            type="email"
                            placeholder="Assignee Email (optional)"
                            value={user.assignee_email}
                            onChange={(e) => handleNameChange(index, "assignee_email", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                        />
                    </div>
                </div>
                )}
            </div> */}
        </div>
    );
}

export default Recipeint;