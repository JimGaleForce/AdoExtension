import dayjs from "dayjs";
import { WorkItem, WorkItemFields, WorkItemHistory, WorkItemType } from "../../../models/adoApi";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { DateRangeItemParser, DateRangeSummary } from "../../../models/adoSummary";
import { WorkItemTags } from "../../../models/ItemTag";
import {  GetBatchItemDetails, GetWorkItem, GetWorkItemHistory } from "../../api";
import { Macro, WiqlQueryBuilder } from "../../api/wiql/wiql";
import { ItemSummary } from "../../../models/adoSummary/item";
import { CompletedParser, HistoryItemParser, WorkItemTypeParser } from "./parser";

const DateRangeSummaryParser: DateRangeItemParser[] = [
    CompletedParser,
    WorkItemTypeParser,
    HistoryItemParser,
]

// Generates a proper ADO Summary for a given date range
export async function SummaryForDateRange(startDate: string, endDate: string) {
    // Get all items from the specified date range.
    // For each item:
    // - Get state of item as it was during the start of the specified date range
    // - Get history of item, looking only at the changes during the date range
    // - Figure out if item is of relevance to us in any capacity
    // - Tag item with any metadata
    // - Save item to output if relevant
    //
    // After this, output a markdown of all output items

    const config = await loadConfig();

    // First - get data about specified iteration (start date / end date)
    // const workItemIds = await GetWorkItemsFromStorageByIteration(iterationId);

    let summary: DateRangeSummary = {
        startDate: dayjs(startDate).toDate(),
        endDate: dayjs(endDate).toDate(),
        topDownMap: {},
        workItems: {}
    }

    const query = WiqlQueryBuilder
        .select("workitems", ["System.AssignedTo", "System.ChangedDate", "System.State"])
        .where("System.ChangedDate", '>=', startDate)
        .and("System.ChangedDate", '<=', endDate)
        .andGroup(builder => {
            builder
                .ever("System.AssignedTo", "=", Macro.CurrentUser)
        })
        .andGroup(builder => {
            builder
                .where("System.State", "EVER", "Resolved")
                .or("System.State", "EVER", "Closed")
                .or("System.State", "EVER", "Completed")
        })
        ;

    console.log("Query:");
    console.log(query.buildQuery());

    const result = await query.execute(config)
    console.log("Result:");
    console.log();

    // We could potentially do a map on `workItemIds` to proceess items
    // in parallel. This was not initially done due to concerns of hitting
    // API limits.
    for (const workItem of result.workItems) {
        const itemSummary = await parseWorkItem(config, workItem.id, startDate, endDate);
        if (itemSummary !== null && itemSummary.tags.completedBy?.uniqueName === config.email) {
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

async function parseWorkItem(config: AdoConfigData, workItemId: string, startDateStr: string, endDateStr: string): Promise<ItemSummary<WorkItemTags> | null> {
    const startDate = dayjs(startDateStr);
    const endDate = dayjs(endDateStr);

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

    let tags: Partial<WorkItemTags> = {}

    // Ignore any events that occured outside of our desired timeframe
    const relevantHistoryEvents = workItemHistory.value.filter(historyEvent => {
        const revisedDate = dayjs(historyEvent.fields?.["System.AuthorizedDate"]?.newValue ?? historyEvent.fields?.["System.ChangedDate"]?.newValue)
        return revisedDate.isAfter(startDate) && revisedDate.isBefore(endDate)
    });

    // Parse the work item using all parsers defined in the IterationSummaryParser.
    // The parser will update the `workItemSummary.tags` object directly
    for (const parser of DateRangeSummaryParser) {
        tags = await parser(config, workItem, relevantHistoryEvents, tags, {});
    }

    return {
        id: workItemId,
        title: workItem.fields["System.Title"],
        type: workItem.fields["System.WorkItemType"],
        state: workItem.fields["System.State"],
        assignedTo: tags.completedBy ?? workItem.fields["System.AssignedTo"],
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


async function ParseItemType(config: AdoConfigData, workItems: WorkItem<keyof WorkItemFields>[], summary: DateRangeSummary): Promise<DateRangeSummary> {
    const { topDownMap } = summary;

    // Fetch and parse parent items
    const parentIds = [...new Set(workItems.map(x => x.fields["System.Parent"]).filter(Boolean).map(String))];
    let parsedParents: WorkItem<keyof WorkItemFields>[] = [];

    if (parentIds.length > 0) {
        console.log("Getting parents of these items");
        parsedParents = await GetBatchItemDetails(config, parentIds, fields);
        parsedParents = parsedParents.filter(x => x) as WorkItem<keyof WorkItemFields>[];
        summary = await ParseItemType(config, parsedParents, summary);
    }

    for (const workItem of workItems) {
        const itemKey = workItem.fields["System.WorkItemType"] as WorkItemType;
        const itemId = String(workItem.id);
        
        // Ensure current item is defined in the map
        if (!topDownMap[itemKey]) {
            topDownMap[itemKey] = {};
        }
        if (!topDownMap[itemKey]?.[itemId]) {
            topDownMap[itemKey]![itemId] = {
                title: workItem.fields["System.Title"],
                type: itemKey,
                assignedTo: []
            };
        }

        // Handle parents and children relationships
        if (workItem.fields["System.Parent"]) {
            const parent = String(workItem.fields["System.Parent"]);
            const parentType = parsedParents.find(x => String(x.id) === parent)?.fields["System.WorkItemType"];

            topDownMap[itemKey]![itemId]!.parent = {
                id: parent,
                workItemType: parentType as WorkItemType
            };
            

            if (parentType && topDownMap[parentType]) {
                const currentParent = topDownMap[parentType]?.[parent];
                if (currentParent) {
                    currentParent.children = currentParent.children || [];
                    if (!currentParent.children.some(x => x.id === itemId)) {
                        currentParent.children.push({ id: itemId, workItemType: itemKey });
                    }
                }
            }
        }
    }

    return summary;
}

// Given the finalized summary, finalize the top down map.
// This gives us the parents of all items in the summary until we hit either a key result or an epic.
// From here, we are able to generate a summary table starting from the Epic / K/R Level.
async function MapOutWorkItems(summary: DateRangeSummary): Promise<DateRangeSummary> {
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

        console.log(`Getting iteam information of all ${workItemType} (like parents)`);
        const itemsParsed = await GetBatchItemDetails(config, items, fields);
        console.log(`Parsing ${workItemType}s`);
        summary = await ParseItemType(config, itemsParsed, summary);
    });

    await Promise.all(promises);

    console.log("Done parsing all items");
    return summary;
}