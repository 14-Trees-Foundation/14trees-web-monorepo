import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { Contribution } from "schema";
/*
    inputs: react-hook-form register function
    outputs: number of trees value, contribution type
*/

type SelectorProps = {
  onChange: (
    n: number,
    t: Contribution["contribution"]["type"],
    nn: string
  ) => void;
};

const NumTreesSelector = ({ onChange }: SelectorProps) => {
  type SelectorState = {
    numTrees: number;
    type: "preset" | "large" | "csr" | "custom";
    notes: string;
  };
  const [state, setState] = useState<SelectorState>({
    numTrees: 1,
    type: "preset",
    notes: "",
  });
  useEffect(() => {
    let type: Contribution["contribution"]["type"] = "one-time";
    if (state.type === "large") type = "large";
    if (state.type === "csr") type = "csr";
    onChange(state.numTrees, type, state.notes);
  }, [state, onChange]);

  const handleSelection = (e) => {
    const selection = e.target.value;
    // if selection is a number, set selection state to custom and set numTrees to that number
    switch (selection) {
      case "1":
        setState({ numTrees: 1, type: "preset", notes: "" });
        break;
      case "5":
        setState({ numTrees: 5, type: "preset", notes: "" });
        break;
      case "14":
        setState({ numTrees: 14, type: "preset", notes: "" });
        break;
      case "csr":
        setState((s) => ({ ...s, type: "csr" }));
        break;
      case "large":
        setState((s) => ({ ...s, type: "large" }));
        break;
      default:
        if (!isNaN(selection)) {
          if (selection > 32)
            setState({ numTrees: selection, type: "large", notes: "" });
          else setState({ numTrees: selection, type: "custom", notes: "" });
        }
    }
  };
  return (
    <div className="mx-auto mt-12 w-full sm:w-2/3">
      <ul className="w-full" onChange={handleSelection}>
        <div className="flex flex-wrap gap-2 sm:h-24">
          <li className="h-full flex-grow sm:w-20 sm:flex-grow-0">
            <input
              type="radio"
              id="single"
              name="select-trees"
              value="1"
              className="peer hidden"
              checked={state.type === "preset" && state.numTrees === 1}
            />
            <label htmlFor="single" className="form-select-label">
              <div className="block w-full">
                <div className="w-full text-center text-lg font-semibold">
                  1
                </div>
              </div>
            </label>
          </li>
          <li className="h-full flex-grow sm:w-20 sm:flex-grow-0">
            <input
              type="radio"
              id="fiver"
              name="select-trees"
              value="5"
              className="peer hidden"
              checked={state.type === "preset" && state.numTrees === 5}
            />
            <label htmlFor="fiver" className="form-select-label">
              <div className="block w-full">
                <div className="w-full text-center text-lg font-semibold">
                  5
                </div>
              </div>
            </label>
          </li>
          <li className="h-full flex-grow sm:w-20 sm:flex-grow-0">
            <input
              type="radio"
              id="fourteen"
              name="select-trees"
              value="14"
              className="peer hidden"
              checked={state.type === "preset" && state.numTrees === 14}
            />
            <label htmlFor="fourteen" className="form-select-label">
              <div className="block w-full">
                <div className="w-full text-center text-lg font-semibold">
                  14
                </div>
              </div>
            </label>
          </li>
          <li className="h-full w-full flex-grow sm:w-min">
            <input
              type="radio"
              id="other"
              name="select-trees"
              value="other"
              className="peer hidden"
              checked={state.type === "custom"}
            />
            <input
              placeholder="other"
              type="number"
              onClick={handleSelection}
              className={`form-select-label px-8 py-5 outline-none ${
                state.type === "custom" && "border-green-600"
              }`}
            ></input>
          </li>
        </div>
        <div className="mt-2 inline-flex w-full gap-2">
          <li className="flex-grow">
            <input
              type="radio"
              id="large"
              name="select-trees"
              value="large"
              className="peer hidden"
              checked={state.type === "large"}
            />
            <label htmlFor="large" className="form-select-label w-full">
              <div className="inline-flex w-full">
                <div className="w-full flex-grow text-lg font-semibold">
                  Large Contribution
                </div>
                <ChevronRightIcon className="w-6" />
              </div>
            </label>
          </li>
          <li className="flex-grow">
            <input
              type="radio"
              id="csr"
              name="select-trees"
              value="csr"
              className="peer hidden"
              checked={state.type === "csr"}
            />
            <label htmlFor="csr" className="form-select-label w-full">
              <div className="inline-flex w-full">
                <div className="w-full flex-grow text-lg font-semibold">
                  CSR Contributions
                </div>
                <ChevronRightIcon className="w-6" />
              </div>
            </label>
          </li>
        </div>
      </ul>
      {/* {error && <p>{error.message}</p>} */}
      {["csr", "large"].includes(state.type) ? (
        <div>
          {/* Help text: please submit with your contact information and any additional message (text box), and we will reach out to you soon */}
          <div className="mt-6 w-full text-left text-gray-600 dark:text-gray-400">
            <span className="text-lg italic">
              Please submit with your contact information, and we will reach out
              to you shortly.
            </span>
            <input
              className="mt-2 w-full rounded-sm border-2 border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              type="text"
              name="message"
              placeholder="Message"
              value={state.notes}
              onChange={(e) =>
                setState((s) => ({ ...s, notes: e.target.value }))
              }
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 w-full text-left text-xl dark:text-gray-200">
          <span className="text-lg font-light">Contribution Amount: </span>
          <span>₹ {3000 * state.numTrees}</span>
        </div>
      )}
    </div>
  );
};

export default NumTreesSelector;