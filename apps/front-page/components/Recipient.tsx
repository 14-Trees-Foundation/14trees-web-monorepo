import { useState } from "react";

interface DedicatedName {
    recipient_name: string;
    recipient_email: string;
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
}

const Recipeint: React.FC<RecipeintProps> = ({ maxTrees, index, user, errors, handleNameChange, handleRemoveName }) => {

    const [isAssigneeDifferent, setIsAssigneeDifferent] = useState(false);

    return (
        <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">Recipient {index + 1}</h3>
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
                <div className="flex items-center gap-4">
                    <label className="block text-gray-700 whitespace-nowrap">Number of trees:</label>
                    <div className="flex flex-col gap-1">
                        <input
                            type="number"
                            min="1"
                            max={maxTrees}
                            className={`w-32 h-10 rounded-md border ${errors[`treeCount-${index}`] ? "border-red-500" : "border-gray-300"
                                } px-4 py-3 text-gray-700`}
                            value={user.trees_count || ""}
                            onChange={(e) => {
                                const value = Math.min(Number(e.target.value), maxTrees);
                                handleNameChange(index, "trees_count", value > 0 ? value.toString() : "");
                            }}
                            required
                        />
                    </div>
                    {errors[`treeCount-${index}`] && (
                        <p className="text-sm text-red-600">{errors[`treeCount-${index}`]}</p>
                    )}
                </div>

                {/* Recipient Name */}
                <div>
                    <label className="block text-gray-700 mb-1">Recipient name:</label>
                    <input
                        type="text"
                        placeholder="Type Recipient name"
                        className={`w-full rounded-md border ${errors[`dedicatedName-${index}`] ? "border-red-500" : "border-gray-300"
                            } px-4 py-3 text-gray-700`}
                        value={user.recipient_name}
                        onChange={(e) => handleNameChange(index, "recipient_name", e.target.value)}
                    />
                    {errors[`dedicatedName-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`dedicatedName-${index}`]}</p>
                    )}
                </div>

                {/* Recipient Email */}
                <div>
                    <label className="block text-gray-700 mb-1">Recipient email ID:</label>
                    <input
                        type="email"
                        placeholder="Type Recipient's email"
                        className={`w-full rounded-md border ${errors[`dedicatedEmail-${index}`] ? "border-red-500" : "border-gray-300"
                            } px-4 py-3 text-gray-700`}
                        value={user.recipient_email}
                        onChange={(e) => handleNameChange(index, "recipient_email", e.target.value)}
                    />
                    {errors[`dedicatedEmail-${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`dedicatedEmail-${index}`]}</p>
                    )}
                </div>
            </div>

            {/* Assignee Section */}
            <div className="mt-4 pt-4 border-t">
                <label className="flex items-center space-x-3 mb-4">
                    <input
                        type="checkbox"
                        checked={isAssigneeDifferent}
                        onChange={(e) => setIsAssigneeDifferent(e.target.checked)}
                        className="h-5 w-5"
                    />
                    <span>Assign trees to someone else?</span>
                </label>

                {isAssigneeDifferent && (
                    <div className="border border-gray-200 rounded-md p-4 space-y-4 bg-gray-50">
                        <h3 className="font-medium">Assignee Details</h3>
                        <input
                            type="text"
                            placeholder="Assignee Name *"
                            value={user.assignee_name}
                            onChange={(e) => handleNameChange(index, "assignee_name", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-4 py-3"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Assignee Email (optional)"
                            value={user.assignee_email}
                            onChange={(e) => handleNameChange(index, "assignee_email", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-4 py-3"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Recipeint;