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
        workItems: [],
        topDownMap: {}
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
    "System.WorkItemType",
    "System.AssignedTo",
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
        summary = await ParseItemType(config, parsedParents, summary);
    }

    // Now all parents should be defined, we can start filling out the map
    for (const workItem of workItems) {
        topDownMap[workItem.fields["System.WorkItemType"]] = topDownMap[workItem.fields["System.WorkItemType"]] ?? {};

        // Ensure current item is defined
        topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)] = topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)] ?? {
            assignedTo: new Set(),
        }

        // Add assigned user to this item
        if (workItem?.fields["System.AssignedTo"]?.uniqueName !== undefined || workItem?.fields["System.AssignedTo"]?.displayName !== undefined) {
            topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].assignedTo.add(workItem.fields["System.AssignedTo"].uniqueName ?? workItem.fields["System.AssignedTo"].displayName);
        } else {
            console.warn(`Work item ${workItem.id} has no assigned user`, {...workItem});
        }

        if (workItem.fields["System.Parent"]) {
            topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].parent = String(workItem.fields["System.Parent"]);
        }

        // Parent and parent type is guaranteed to be defined due to recursion
        if (workItem.fields["System.Parent"]) {
            const parent = workItem.fields["System.Parent"];
            const parentType = parsedParents.find(x => x.id === parent)?.fields["System.WorkItemType"];

            if (parent && parentType) {
                topDownMap[workItem.fields["System.WorkItemType"]]![String(workItem.id)].assignedTo.forEach(assignedTo => topDownMap[parentType]![parent].assignedTo.add(assignedTo))
                topDownMap[parentType]![parent].children = topDownMap[parentType]![parent].children ?? new Set();
                topDownMap[parentType]![parent].children!.add(String(workItem.id));
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

    const bugs = summary.workItems.filter(x => x.tags.workItemType === "Bug").map(x => x.id);
    const tasks = summary.workItems.filter(x => x.tags.workItemType === "Task").map(x => x.id);
    const deliverables = summary.workItems.filter(x => x.tags.workItemType === "Deliverable").map(x => x.id);
    const scenarios = summary.workItems.filter(x => x.tags.workItemType === "Scenario").map(x => x.id);
    const epics = summary.workItems.filter(x => x.tags.workItemType === "Epic").map(x => x.id);
    const krs = summary.workItems.filter(x => x.tags.workItemType === "Key Result").map(x => x.id);


    if (bugs.length > 0) {
        console.log("Getting parents of all bugs");
        const bugsParsed = await GetBatchItemDetails(config, bugs, fields);
        console.log("Parsing bugs");
        summary = await ParseItemType(config, bugsParsed, summary);
    }

    if (tasks.length > 0) {
        console.log("Getting parents of all tasks");
        const tasksParsed = await GetBatchItemDetails(config, tasks, fields);
        console.log("Parsing tasks");
        summary = await ParseItemType(config, tasksParsed, summary);
    }

    if (deliverables.length > 0) {
        console.log("Getting parents of all deliverables");
        const deliverablesParsed = await GetBatchItemDetails(config, deliverables, fields);
        console.log("Parsing deliverables");
        summary = await ParseItemType(config, deliverablesParsed, summary);
    }

    if (scenarios.length > 0) {
        console.log("Getting parents of all scenarios");
        const scenariosParsed = await GetBatchItemDetails(config, scenarios, fields);
        console.log("Parsing scenarios");
        summary = await ParseItemType(config, scenariosParsed, summary);
    }

    if (epics.length > 0) {
        console.log("Getting parents of all epics");
        const epicsParsed = await GetBatchItemDetails(config, epics, fields);
        console.log("Parsing epics");
        summary = await ParseItemType(config, epicsParsed, summary);
    }

    if (krs.length > 0){
        console.log("Getting parents of all K/R's");
        const krsParsed = await GetBatchItemDetails(config, krs, fields);
        console.log("Parsing K/R's");
        summary = await ParseItemType(config, krsParsed, summary);
    }

    console.log("Done parsing all items");
    return summary;
}