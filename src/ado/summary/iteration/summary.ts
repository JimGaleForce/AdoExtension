import dayjs from "dayjs";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { GetWorkItemsFromStorageByIteration, ItemSummary, IterationSummary } from "../../../models/adoSummary";
import { IterationItemParser } from "../../../models/adoSummary/iteration";
import { WorkItemTags } from "../../../models/ItemTag";
import { GetIteration, GetWorkItem, GetWorkItemHistory } from "../../api";
import { CapacityParser } from "./parser";


const IterationSummaryParser: IterationItemParser[] = [
    CapacityParser
]

// Generates a proper ADO Summary for a given iteration 
export async function SummaryForIteration(iterationId: string) {
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
    const workItemIds = await GetWorkItemsFromStorageByIteration(iterationId);

    const {startDate, finishDate} = iteration.attributes;

    let summary: IterationSummary = {
        iteration: iteration,
        workItems: []
    }

    // We could potentially do a map on `workItemIds` to proceess items
    // in parallel. This was not initially done due to concerns of hitting
    // API limits.
    for (const workItemId of workItemIds) {
        const itemSummary = await parseWorkItem(config, workItemId, startDate, finishDate);
        if (itemSummary !== null) { 
            summary.workItems.push(itemSummary);
        }
    }
    
}

async function parseWorkItem(config: AdoConfigData, workItemId: number, startDateStr: string, finishDateStr: string): Promise<ItemSummary<WorkItemTags> | null> {
    const startDate = dayjs(startDateStr);
    const finishDate = dayjs(finishDateStr);
    const workItem = await GetWorkItem(config, workItemId, startDateStr)
    const workItemHistory = await GetWorkItemHistory(config, workItemId);

    let tags: Partial<WorkItemTags> = {}

    for (const historyEvent of workItemHistory.value) {
        // Ignore any events that occured outside of our desired timeframe
        const revisedDate = dayjs(historyEvent.revisedDate)
        if (revisedDate.isBefore(startDate) || revisedDate.isAfter(finishDate)) {
            continue;
        }

        // Parse the work item using all parsers defined in the IterationSummaryParser.
        // The parser will update the `workItemSummary.tags` object directly
        for (const parser of IterationSummaryParser) {
            tags = await parser(workItem, tags);
        }
    }

    return {
        id: workItemId,
        title: workItem.fields["System.Title"],
        tags: tags
    }
}