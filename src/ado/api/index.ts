import { AdoConfigData } from "../../models/adoConfig";

export async function GetIterations(
    config: AdoConfigData,
    onlyCurrentIteration = false) {
    const { organization, project, team } = config;
    let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations`;
    if (onlyCurrentIteration) { url += "/?$timeframe=current" };

    const json = await fetch(url).then((response) => response.json());
    return json;
}

export async function GetItemsFromIteration(
    config: AdoConfigData,
    iterationId: string) {
    const { organization, project, team } = config;
    const url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=7.0`

    const json = await fetch(url).then((response) => response.json());
    return json;
}

export async function GetBatchItemDetails(
    config: AdoConfigData,
    itemIds: string[]) {
    const { organization, project } = config;
    const obj = {
        ids: itemIds,
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
    return json;
}

export async function GetItemHistory(config: AdoConfigData, workItem: string) {
    const { organization } = config;
    const url = `https://dev.azure.com/${organization}/apis/wit/workItems/${workItem}/updates?api-version=7.0`

    const json = await fetch(url).then((response) => response.json());
    return json;
}