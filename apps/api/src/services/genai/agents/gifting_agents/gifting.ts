import { START, StateGraph } from "@langchain/langgraph";
import { AgentState, members } from "./common";
import createSupervisorChain from "./agent_supervisor";
import giftPrePurchasedTreesAgentNode from "./gift_pre_purchase_trees_agent";
import requestGiftableTreesAgentNode from "./gift_request_agent";


async function getAgentGraph() {

    const supervisorChain: any = await createSupervisorChain()
    const workflow = new StateGraph(AgentState)
        .addNode("RequestGiftableTrees_Agent", requestGiftableTreesAgentNode)
        .addNode("GiftPrePuchasedTrees_Agent", giftPrePurchasedTreesAgentNode)
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

export default getAgentGraph;