import dayjs from "dayjs";
import { AdoConfigData, loadConfig } from "../../models/adoConfig";
import { WorkItemSummary } from "../../models/adoSummary";
import { GetIteration, GetWorkItem, GetWorkItemHistory } from "../api";

// Generates a proper ADO Summary for a given iteration 
export default async function GenerateADOSummary(iterationId: string, workItemIds: number[]) {
    // Get all items from the specified iteration.
    // For each item:
    // - Get state of item as it was during the start of the specified iteration 
    // - Get history of item, looking only at the changes during the sprint
    // - Figure out if item is of relevance to us in any capacity
    // - Tag item with any metadata 
    // - Save item to output if relevant
    // 
    // After this, output a markdown of all output items

    const config = await loadConfig();

    // First - get data about specified iteration (start date / end date)
    const iteration = await GetIteration(config, iterationId);

    const {startDate, finishDate} = iteration.attributes;

    let summary: WorkItemSummary[] = [];

    // We could potentially do a map on `workItemIds` to proceess items
    // in parallel. This was not initially done due to concerns of hitting
    // API limits.
    for (const workItemId of workItemIds) {
        const itemSummary = await parseWorkItem(config, workItemId, startDate, finishDate);
        if (itemSummary !== null) { 
            summary.push(itemSummary);
        }
    }
    
}

async function parseWorkItem(config: AdoConfigData, workItemId: number, startDateStr: string, finishDateStr: string): Promise<WorkItemSummary | null> {
    const startDate = dayjs(startDateStr);
    const finishDate = dayjs(finishDateStr);
    const workItem = await GetWorkItem(config, workItemId, startDateStr)
    const workItemHistory = await GetWorkItemHistory(config, workItemId);

    for (const historyEvent of workItemHistory.value) {
        // Ignore any events that occured outside of our desired timeframe
        const revisedDate = dayjs(historyEvent.revisedDate)
        if (revisedDate <= startDate || revisedDate > finishDate) {
            continue;
        }
    }

    return {
        id: workItemId,
        title: ""
    }
}