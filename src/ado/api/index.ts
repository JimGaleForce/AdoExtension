import { BatchWorkItems, Iteration, IterationWorkItems, ListIteration, WorkItem, WorkItemHistory } from "../../models/adoApi";
import { AdoConfigData } from "../../models/adoConfig";

export async function GetIterations(
    config: AdoConfigData,
    onlyCurrentIteration = false): Promise<ListIteration> {
    const { organization, project, team } = config;
    let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations`;
    if (onlyCurrentIteration) { url += "/?$timeframe=current" };

    const json = await fetch(url).then((response) => response.json());

    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting iteration for:`, config)
        throw new Error(json.message);
    }

    return json as ListIteration;
}

export async function GetIteration(config: AdoConfigData, iterationId: string): Promise<Iteration> {
    const { organization, project, team } = config;
    let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}?api-version=7.0`;

    const json = await fetch(url).then((response) => response.json());
    
    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting iteration ${iterationId}`)
        throw new Error(json.message);
    }

    return json as Iteration;
}

export async function GetCurrentIteration(config: AdoConfigData): Promise<Iteration> {
    
    const iterations = await GetIterations(config, true);
    if (iterations.count !== 1 || iterations.value.length !== 1) {
        throw new Error(`Expected 1 iteration, got ${iterations.count}`)
    }
    
    if (iterations.value[0].attributes.timeFrame !== "current") {
        throw new Error(`Expected iteration to be current, got  ${iterations.value[0].attributes.timeFrame}`)
    }

    return iterations.value[0];
}

export async function GetItemsFromIteration(
    config: AdoConfigData,
    iterationId: string): Promise<IterationWorkItems> {
    const { organization, project, team } = config;
    const url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=7.0`

    const json = await fetch(url).then((response) => response.json());
    
    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting items from iteration ${iterationId}`)
        throw new Error(json.message);
    }

    return json as IterationWorkItems;
}

export async function GetBatchItemDetails(
    config: AdoConfigData,
    workItemIds: string[]): Promise<BatchWorkItems> {
    const { organization, project } = config;
    const obj = {
        ids: workItemIds,
        fields: [
            "System.Id",
            "System.Title",
            "System.WorkItemType",
            "Microsoft.VSTS.Scheduling.RemainingWork",
            "System.AreaPath",
            "System.IterationPath",
            "System.State",
            "System.Reason",
            "System.AssignedTo",
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            "OSG.RemainingDevDays"
        ]
    }
    const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitemsbatch?api-version=7.1-preview.1`;
    const json = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' }
    }).then((response) => response.json());
    

    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting work items by batch. Work items:`, workItemIds)
        throw new Error(json.message);
    }

    return json as BatchWorkItems;
}

export async function GetWorkItemHistory(config: AdoConfigData, workItemId: number): Promise<WorkItemHistory> {
    const { organization } = config;
    const url = `https://dev.azure.com/${organization}/_apis/wit/workItems/${workItemId}/updates?api-version=7.0`

    const json = await fetch(url).then((response) => response.json());

    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting work item history for ${workItemId}`)
        throw new Error(json.message);
    }

    return json as WorkItemHistory;
}

/** 
 * @throws {Error} if item does not exist
 */
export async function GetWorkItem(config: AdoConfigData, workItemId: number, asOf?: string): Promise<WorkItem> {
    const { organization, project } = config;
    const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.0${asOf ? `&asOf=${asOf}` : ""}`

    const json = await fetch(url).then((response) => response.json());

    // If we get an error (i.e. Work item does not exist at the specified datetime)
    if (json.message) {
        console.error(`Error getting work item ${workItemId} (as of ${asOf})`)
        throw new Error(json.message);
    }

    return json as WorkItem;
}