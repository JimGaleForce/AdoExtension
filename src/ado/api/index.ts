import { BatchWorkItems, Iteration, IterationWorkItems, ListIteration, WorkItem, WorkItemHistory } from "../../models/adoApi";
import { AdoConfigData } from "../../models/adoConfig";

async function fetchWithAuth(url: string, retry: number = 0): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyntaxError && retry < 3) {
      console.error(`JSON Parse error. Attempting to authenticate. Retry ${retry + 1} / 3`);
      // JSON parse error indicates unauthenticated request
      await authenticate(url);
      return fetchWithAuth(url, retry + 1);
    } else {
      throw error;
    }
  }
}

async function authenticate(url: string): Promise<void> {
    // Open a new tab in the background
    const tab = await chrome.tabs.create({
      url: url,
      active: false,
    });
  
    // Wait for the tab to fully load
    await new Promise<void>((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          // Remove the listener and resolve the promise
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  
    // Close the tab
    if (tab.id) {
        await chrome.tabs.remove(tab.id);
    }
  }

export async function GetIterations(
    config: AdoConfigData,
    onlyCurrentIteration = false): Promise<ListIteration> {
    const project = ExtractProject(config);
    const team = ExtractTeam(config);
    const { organization } = config;
    let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations`;
    if (onlyCurrentIteration) { url += "/?$timeframe=current" };

    const json = await fetchWithAuth(url);

    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
        console.error(`Error getting iteration for:`, config)
        throw new Error(json.message);
    }

    return json as ListIteration;
}

export async function httpGetAsyncX(callback: { (list: any): void; (arg0: string): any; }, theUrl: string | URL) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = async () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        await callback(xmlHttp.responseText);
      }
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
  }
  

export async function getIterationsX(root: string, callback: any) {
    const url = root + "/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1";
    await httpGetAsyncX(callback, url);
    //https://microsoft.visualstudio.com/Edge/Feedback%20and%20Diagnostics/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1
}

export async function GetIteration(config: AdoConfigData, iterationId: string): Promise<Iteration> {
    const project = ExtractProject(config);
    const team = ExtractTeam(config);
    const { organization } = config;
    let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}?api-version=7.0`;

    const json = await fetchWithAuth(url);
    
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

export function ExtractProject(config: AdoConfigData) {
    return config && config.projectPath ? config.projectPath.substring(0, config.projectPath.indexOf('/')) : '';
}

export function ExtractTeam(config: AdoConfigData) {
    return config && config.projectPath ? config.projectPath.substring(config.projectPath.lastIndexOf('/')+1) : '';
}

export async function GetItemsFromIteration(
    config: AdoConfigData,
    iterationId: string): Promise<IterationWorkItems> {        

    const project = ExtractProject(config);
    const team = ExtractTeam(config);
    const { organization } = config;

    const url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=7.0`

    const json = await fetchWithAuth(url);
    
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
        const project = ExtractProject(config);
        const { organization } = config;
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

    const json = await fetchWithAuth(url);

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
    const project = ExtractProject(config);
    const { organization } = config;
    const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.0${asOf ? `&asOf=${asOf}` : ""}`

    const json = await fetchWithAuth(url);

    // If we get an error (i.e. Work item does not exist at the specified datetime)
    if (json.message) {
        console.error(`Error getting work item ${workItemId} (as of ${asOf})`)
        throw new Error(json.message);
    }

    return json as WorkItem;
}