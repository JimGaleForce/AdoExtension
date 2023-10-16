import { ItemParser, ItemSummary, TopDownMap } from "./item";
import { Iteration, WorkItemResult, WorkItemType } from "../adoApi";
import { WorkItemTags } from "../ItemTag";
import { GetIteration, GetTeamValues } from "../../ado/api";
import { WiqlQueryBuilder } from "../../ado/api/wiql/wiql";
import { loadConfig } from "../adoConfig";

export type IterationParserExtraData = {
    iteration: Iteration
}

// Get all work items that were ever in an iteration for a given area path
export async function LoadWorkItemsForIteration(team: string, iterationId: string): Promise<WorkItemResult[]> {
    const config = await loadConfig();

    console.log(`Getting iteration for team ${team} by id: ${iterationId}`);
    const iteration = await GetIteration(config, iterationId);
    console.log("Got iteration: ", iteration);
    console.log("Getting team's area path");
    const teamValues = await GetTeamValues(config, team);
    console.log("Got team values: ", teamValues);

    const query = WiqlQueryBuilder
        .select("workitems", /* work item fields: */ ["System.AreaPath", "System.IterationPath"])
        .where("System.AreaPath", '=', teamValues.defaultValue)
        .andEver("System.IterationPath", '=', iteration.path)
        ;
    
    const result = await query.execute(config);
    return result.workItems

    // console.log(`Parsing ${result.workItems.length} Items:`, result.workItems)
    // const batchItems = await GetBatchItemDetails(config, result.workItems.map(i => i.id), fields);

    // console.log("Result: ", batchItems);
    // return batchItems;
}

export type IterationItemParser = ItemParser<WorkItemTags, IterationParserExtraData>

export interface IterationSummary {
    iteration: Iteration
    workItems: {
        [key: string]: ItemSummary<WorkItemTags>
    }
    topDownMap: TopDownMap
}
