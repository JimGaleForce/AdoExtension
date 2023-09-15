import dayjs from "dayjs";
import { Iteration, WorkItem, WorkItemFields, WorkItemHistory, WorkItemType } from "../../../models/adoApi";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { IterationSummary } from "../../../models/adoSummary";
import { IterationItemParser, IterationParserExtraData, LoadWorkItemsForIteration } from "../../../models/adoSummary/iteration";
import { WorkItemTags } from "../../../models/ItemTag";
import {  GetBatchItemDetails, GetIteration, GetWorkItem, GetWorkItemHistory } from "../../api";
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
        workItems: {},
        topDownMap: {}
    }

    // We could potentially do a map on `workItemIds` to proceess items
    // in parallel. This was not initially done due to concerns of hitting
    // API limits.
    for (const workItem of workItems) {
        const itemSummary = await parseWorkItem(config, iteration, workItem.id, startDate, finishDate);
        if (itemSummary !== null) {
            summary.workItems[itemSummary.id] = itemSummary;
        }
    }

    console.log("Summary Done. Creating map")
    console.log(summary);

    summary = await MapOutWorkItems(summary);

    console.log("Map Done. Returning completedsummary")
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

const fields: (keyof WorkItemFields)[] = [
    "System.Id",
    "System.Title",
    "System.WorkItemType",
    "System.AssignedTo",
    "System.AreaPath",
    "System.Parent"
]


async function ParseItemType(config: AdoConfigData, workItems: WorkItem<keyof WorkItemFields>[], summary: IterationSummary): Promise<IterationSummary> {
    const { topDownMap } = summary;

    const parentIds = workItems.map(x => x.fields["System.Parent"]).filter(x => x !== undefined).map(x => String(x));
    let parsedParents: WorkItem<keyof WorkItemFields>[] = [];
    // If parents exist, recursively get all parent work items from this type
    if (parentIds.length > 0) {
        console.log("Getting parents of these items");
        parsedParents = await GetBatchItemDetails(config, parentIds, fields);
        parsedParents = parsedParents.filter(x => x) as WorkItem<keyof WorkItemFields>[];
        summary = await ParseItemType(config, parsedParents, summary);
    }

    // Now all parents should be defined, we can start filling out the map
    for (const workItem of workItems) {
        topDownMap[workItem.fields["System.WorkItemType"]] = topDownMap[workItem.fields["System.WorkItemType"]] ?? {};

        // Ensure current item is defined
        topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)] = topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)] ?? {
            title: workItem.fields["System.Title"],
            assignedTo: []
        }

        // Add assigned user to this item
        if (workItem?.fields["System.AssignedTo"]?.uniqueName !== undefined || workItem?.fields["System.AssignedTo"]?.displayName !== undefined) {
            const name = workItem?.fields["System.AssignedTo"]?.uniqueName ?? workItem?.fields["System.AssignedTo"]?.displayName;
            if (topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].assignedTo.indexOf(name) === -1) {
                topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].assignedTo.push(name);
            }
        } else {
            console.warn(`Work item ${workItem.id} has no assigned user`, {...workItem});
        }

        if (workItem.fields["System.Parent"]) {
            topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].parent = {
                id: String(workItem.fields["System.Parent"]),
                workItemType: workItem.fields["System.WorkItemType"]
            }
        }

        // Parent and parent type is guaranteed to be defined due to recursion
        if (workItem.fields["System.Parent"]) {
            const parent = workItem.fields["System.Parent"];
            const parentType = parsedParents.find(x => x.id === parent)?.fields["System.WorkItemType"];

            if (parent && parentType) {
                topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].assignedTo.forEach(assignedTo => {
                    if (topDownMap[parentType]![parent].assignedTo.indexOf(assignedTo) === -1) {
                        topDownMap[parentType]![parent].assignedTo.push(assignedTo)
                    }
                });
                topDownMap[parentType]![parent].children = topDownMap[parentType]![parent].children ?? [];

                if (!topDownMap[parentType]![parent].children!.some(x => x.id === String(workItem.id))) {
                    topDownMap[parentType]![parent].children!.push({
                        id: String(workItem.id),
                        workItemType: workItem.fields["System.WorkItemType"]
                    });
                }
            }
        }
    }

    return summary;
}

// Given the finalized summary, finalize the top down map.
// This gives us the parents of all items in the summary until we hit either a key result or an epic.
// From here, we are able to generate a summary table starting from the Epic / K/R Level.
async function MapOutWorkItems(summary: IterationSummary): Promise<IterationSummary> {
    const config = await loadConfig();

    const workItemTypes: WorkItemType[] = ["Bug", "Task", "Deliverable", "Scenario", "Epic", "Key Result"];

    const promises = workItemTypes.map(async (workItemType) => {
        let items = [];
        console.log("Getting all items of type: ", workItemType);
        for (const key in summary.workItems) {
            const workItem = summary.workItems[key];
            if (workItem.tags?.workItemType === workItemType && !workItem.tags?.ignore) {
                items.push(workItem.id);
            }
        }

        if (items.length === 0) {
            console.log("No items of type: ", workItemType);
            return;
        }

        console.log(`Getting parents of all ${workItemType}`);
        const itemsParsed = await GetBatchItemDetails(config, items, fields);
        console.log(`Parsing ${workItemType}s`);
        summary = await ParseItemType(config, itemsParsed, summary);
    });

    await Promise.all(promises);

    console.log("Done parsing all items");
    return summary;
}