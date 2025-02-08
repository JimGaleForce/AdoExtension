import { ItemParser, ItemSummary, TopDownMap } from "./item";
import { WorkItemResult } from "../adoApi";
import { WorkItemTags } from "../ItemTag";
import { GetTeamValues } from "../../ado/api";
import { WiqlQueryBuilder } from "../../ado/api/wiql/wiql";
import { loadConfig } from "../adoConfig";

export type CycleParserExtraData = {
    cycle: string
}

// Get all work items that were ever in a cycle for a given area path
export async function LoadWorkItemsForCycle(team: string, cycle: string, iterationPaths: string[]): Promise<WorkItemResult[]> {
    const config = await loadConfig();

    console.log(`Getting cycle for team ${team} for cycle: ${cycle}`);
    console.log("Getting team's area path");
    const teamValues = await GetTeamValues(config, team);
    console.log("Got team values: ", teamValues);

    const query = WiqlQueryBuilder
        .select("workitems", /* work item fields: */ ["System.AreaPath", "System.IterationPath", "System.ChangedDate"])
        .where("System.AreaPath", '=', teamValues.defaultValue)
        .andGroup(builder => {
            let first = true;
            for (var pathId in iterationPaths) {
                if (first) {
                    builder = builder.where("System.IterationPath", "EVER", iterationPaths[pathId]);
                    first = false;
                } else {
                    builder = builder.or("System.IterationPath", "EVER", iterationPaths[pathId]);
                }
            }
        })
        ;
    
    console.log("Query:", query.buildQuery());
    const result = await query.execute(config);
    return result.workItems
}

export type CycleItemParser = ItemParser<WorkItemTags, CycleParserExtraData>

export interface CycleSummary {
    cycle: string,
    startDate: string,
    finishDate: string,
    workItems: {
        [key: string]: ItemSummary<WorkItemTags>
    }
    topDownMap: TopDownMap
}
