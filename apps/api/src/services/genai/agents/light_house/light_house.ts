import { START, StateGraph } from "@langchain/langgraph";
import { AgentState, members } from "./common";
import createSupervisorChain from "./agent_supervisor";
import supplierAgentNode from "./web_supplier";
import buyerAgentNode from "./web_buyer";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

async function getAgentGraph() {

    const supervisorChain: any = await createSupervisorChain()
    const workflow = new StateGraph(AgentState)
        .addNode("Supplier_Agent", supplierAgentNode)
        .addNode("Buyer_Agent", buyerAgentNode)
        .addNode("supervisor", supervisorChain);

    members.forEach((member) => {
        workflow.addEdge(member, "supervisor");
    });

    workflow.addConditionalEdges(
        "supervisor",
        (x: typeof AgentState.State) => x.next,
    );

    workflow.addEdge(START, "supervisor");

    return workflow.compile();
}

export const interactLightHouseAgent = async (query: string, history: BaseMessage[]) => {

    const graph = await getAgentGraph();
    const result = await graph.invoke({ messages: [
        ...history,
        new HumanMessage({
            content: query,
        }),
    ]}, { recursionLimit: 100 })

    let output = result.messages[result.messages.length - 1].content;
    return output;
}
