import dayjs from "dayjs";
import { Iteration, WorkItemHistory } from "../../../models/adoApi";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { IterationSummary } from "../../../models/adoSummary";
import { IterationItemParser, IterationParserExtraData, LoadWorkItemsForIteration } from "../../../models/adoSummary/iteration";
import { WorkItemTags } from "../../../models/ItemTag";
import {  GetIteration, GetWorkItem, GetWorkItemHistory } from "../../api";
import { CompletedParser, HistoryItemParser, IterationTrackerParser, ReassignedParser, WorkItemTypeParser } from "./parser";
import { CapacityParser } from "./parser/CapacityParser";
import { ItemSummary } from "../../../models/adoSummary/item";
import { IgnoreParser } from "./parser/IgnoreParser";
import { AssignedToParser } from "./parser/AssignedToParser";

// Parsers are ran sequentially
const IterationSummaryParser: IterationItemParser[] = [
    IgnoreParser,
    AssignedToParser,
    ReassignedParser,
    CompletedParser,
    IterationTrackerParser,
    WorkItemTypeParser,
    CapacityParser,
    HistoryItemParser,
]

// Generates a proper ADO Summary for a given team and iteration
export async function SummaryForIteration(team: string, iterationId: string) {
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
    const workItems = await LoadWorkItemsForIteration(team, iterationId);

    const { startDate, finishDate } = iteration.attributes;

    let summary: IterationSummary = {
        iteration: iteration,
        workItems: []
    }

    // We could potentially do a map on `workItemIds` to proceess items
    // in parallel. This was not initially done due to concerns of hitting
    // API limits.
    for (const workItem of workItems) {
        const itemSummary = await parseWorkItem(config, iteration, workItem.id, startDate, finishDate);
        if (itemSummary !== null) {
            summary.workItems.push(itemSummary);
        }
    }

    console.log("Summary Done.")
    console.log(summary);
    return summary;
}

async function parseWorkItem(config: AdoConfigData, iteration: Iteration, workItemId: string, startDateStr: string, finishDateStr: string): Promise<ItemSummary<WorkItemTags> | null> {
    const startDate = dayjs(startDateStr);
    const finishDate = dayjs(finishDateStr);

    let workItemHistory: WorkItemHistory;
    try {
        workItemHistory = await GetWorkItemHistory(config, workItemId);
    } catch {
        return null;
    }

    if (workItemHistory.count === 0 || !workItemHistory.value[0].fields?.["System.AuthorizedDate"]?.newValue) {
        console.warn(`No history for item ${workItemId}. Skipping`);
        return null;
    }

    // Beacuse the work item may have been made after the sprint started, we need to see when the item was created.
    // The first item in the work item history is the creation of the item and hence the timestamp of when it was created.
    // We're going to grab the item as it was either at the start of the iteration, or creation date. Whichever is later.
    const workItemCreatedAtStr = workItemHistory.value[0].fields?.["System.AuthorizedDate"]?.newValue
    const workItemCreatedAt = dayjs(workItemCreatedAtStr)
    const queryDate = workItemCreatedAt.isAfter(startDate) ? workItemCreatedAtStr : startDateStr;
    const workItem = await GetWorkItem(config, workItemId, queryDate)
    const extraData: IterationParserExtraData = {
        iteration: iteration
    }

    let tags: Partial<WorkItemTags> = {}

    // Ignore any events that occured outside of our desired timeframe
    const relevantHistoryEvents = workItemHistory.value.filter(historyEvent => {
        const revisedDate = dayjs(historyEvent.fields?.["System.AuthorizedDate"]?.newValue ?? historyEvent.fields?.["System.ChangedDate"]?.newValue)
        return revisedDate.isAfter(startDate) && revisedDate.isBefore(finishDate)
    });

    // Parse the work item using all parsers defined in the IterationSummaryParser.
    // The parser will update the `workItemSummary.tags` object directly
    for (const parser of IterationSummaryParser) {
        tags = await parser(config, workItem, relevantHistoryEvents, tags, extraData);
    }

    return {
        id: workItemId,
        title: workItem.fields["System.Title"],
        tags: tags,
    }
}
