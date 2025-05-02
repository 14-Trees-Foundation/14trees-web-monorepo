import { z } from "zod";
import { END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { members } from "./common";

const systemPrompt = `You are a supervisor managing a conversation between the following agents: {members}.
Your job is to decide which agent should act next based on the current conversation.

Each agent performs a task and either:
- Returns a result, or
- Asks the user for more information.

If an agent asks the user for more input, or if the overall task is complete, respond with ${END}.

Respond with only one of the following options: {options}.`;

const options = [END, ...members] as const;

// Define the routing function
const routingTool = {
  name: "route",
  description: "Select the next role.",
  schema: z.object({
    next: z.enum(options),
  }),
};

async function createSupervisorChain() {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
    [
      "human",
      "Given the conversation above, who should act next?" +
      " Or should we FINISH? Select one of: {options}",
    ],
  ]);

  const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
  });

  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

  const supervisorChain = formattedPrompt
    .pipe(
      llm.bindTools([routingTool], {
        tool_choice: "route",
      })
    )
    // select the first one
    .pipe((x) => x.tool_calls?.[0]?.args);

  return supervisorChain;
}

export default createSupervisorChain;