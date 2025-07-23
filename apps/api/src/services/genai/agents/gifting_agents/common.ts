
// This defines the object that is passed between each node

import { BaseMessage } from "@langchain/core/messages";
import { Annotation, END } from "@langchain/langgraph";

export const members = ["RequestGiftableTrees_Agent", "GiftPrePuchasedTrees_Agent"] as const;

// in the graph. We will create different nodes for each agent and tool
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // The agent node that last performed work
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
});