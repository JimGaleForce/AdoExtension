import { BatchWorkItems, Iteration, IterationFromURL, IterationWorkItems, ListIteration, TeamFieldValues, WorkItem, WorkItemFields, WorkItemHistory } from "../../models/adoApi";
import { AdoConfigData } from "../../models/adoConfig";


async function fetchWithTimeout(url: string, timeout: number = 10000) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout of 10 seconds
  const timeoutId = setTimeout(() => {
    controller.abort(); // Abort the fetch request
    console.log('Request timed out');
  }, timeout);

  const response = await fetch(url, {
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  return response;
}

async function fetchWithAuth(url: string, retry: number = 0): Promise<any> {
  try {
    const response = await fetchWithTimeout(url);
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

export async function post(url: string, body: any, timeout: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout of 30 seconds
  const timeoutId = setTimeout(() => {
    controller.abort(); // Abort the fetch request
    console.log('Request timed out');
  }, timeout);

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal
  });

  clearTimeout(timeoutId);
  return response;
}

export async function postWithAuth(url: string, body: any, retry: number = 0): Promise<any> {
  try {
    const response = await post(url, body);
    if (!response.ok) {
      console.error(await response.json());
      throw new Error("Error posting to ADO");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SyntaxError && retry < 3) {
      console.error(`JSON Parse error. Attempting to authenticate. Retry ${retry + 1} / 3`);
      // JSON parse error indicates unauthenticated request
      await authenticate(url);
      return postWithAuth(url, body, retry + 1);
    } else {
      throw error;
    }
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

export async function GetIterationFromURL(data: IterationFromURL): Promise<Iteration | undefined> {
  const { organization, project, team, iteration } = data;
  let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations/?api-version=7.0`;

  const json = await fetchWithAuth(url);

  // If we get an error (i.e. Work item does not exist)
  if (json.message) {
    console.error(`Error getting iteration ${iteration}`)
    throw new Error(json.message);
  }

  const iterations = json as ListIteration;

  const iterationObj = iterations.value.find((i) => i.name === iteration);
  console.log(iterationObj);
  return iterationObj;
}

export async function GetTeamValues(config: AdoConfigData, team: string): Promise<TeamFieldValues> {
  const project = ExtractProject(config);
  const { organization } = config;
  let url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/teamfieldvalues?api-version=7.0`;

  const json = await fetchWithAuth(url);

  // If we get an error (i.e. Work item does not exist)
  if (json.message) {
    console.error(`Error getting team field values for: ${team}`)
    throw new Error(json.message);
  }

  return json as TeamFieldValues;
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
  return config && config.projectPath ? config.projectPath.substring(config.projectPath.lastIndexOf('/') + 1) : '';
}

export async function GetItemsFromIteration(
  config: AdoConfigData,
  iterationId: string): Promise<IterationWorkItems> {

  const project = ExtractProject(config);
  const { organization } = config;

  const url = `https://dev.azure.com/${organization}/${project}_apis/work/teamsettings/iterations/${iterationId}/workitems?api-version=7.0`

  const json = await fetchWithAuth(url);

  // If we get an error (i.e. Work item does not exist)
  if (json.message) {
    console.error(`Error getting items from iteration ${iterationId}`)
    throw new Error(json.message);
  }

  return json as IterationWorkItems;
}

const BATCH_SIZE = 200;
export async function GetBatchItemDetails<T extends keyof WorkItemFields>(
  config: AdoConfigData,
  workItemIds: string[],
  workItemFields: T[]): Promise<WorkItem<T>[]> {

  const project = ExtractProject(config);
  const { organization } = config;
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitemsbatch?api-version=7.1-preview.1&$expand=relations`;
  
  // Helper function to post a single batch
  async function postBatch(ids: string[]): Promise<WorkItem<T>[]> {
    const obj = { ids, fields: workItemFields };
    const response = await post(url, obj);
    const json = await response.json();

    // If we get an error (i.e. Work item does not exist)
    if (json.message) {
      console.error(`Error getting work items by batch. Work items:`, ids)
      throw new Error(json.message);
    }

    const result = json as BatchWorkItems;
    return result.value;
  }

  // Splitting the workItemIds into batches
  const batches: string[][] = [];
  for (let i = 0; i < workItemIds.length; i += BATCH_SIZE) {
    batches.push(workItemIds.slice(i, i + BATCH_SIZE));
  }

  // Making API calls for each batch and collecting results
  const results: WorkItem<T>[] = [];
  for (const batch of batches) {
    const batchResults = await postBatch(batch);
    results.push(...batchResults);
  }

  return results;
}

export async function GetWorkItemHistory(config: AdoConfigData, workItemId: string): Promise<WorkItemHistory> {
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
export async function GetWorkItem(config: AdoConfigData, workItemId: string, asOf?: string): Promise<WorkItem> {
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