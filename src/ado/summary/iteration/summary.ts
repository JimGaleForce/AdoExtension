import dayjs from "dayjs";
import { Iteration, WorkItem, WorkItemFields, WorkItemHistory, WorkItemType } from "../../../models/adoApi";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { IterationSummary } from "../../../models/adoSummary";
import { IterationItemParser, IterationParserExtraData, LoadWorkItemsForIteration, TopDownMap } from "../../../models/adoSummary/iteration";
import { WorkItemTags } from "../../../models/ItemTag";
import { GetBatchItemDetails, GetIteration, GetWorkItem, GetWorkItemHistory } from "../../api";
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
    const iteration = await GetIteration(config, iterationId, team);
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
        type: workItem.fields["System.WorkItemType"],
        state: workItem.fields["System.State"],
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

        // Handle assignment of users to items
        const assignedToField = workItem?.fields["System.AssignedTo"];
        const name = assignedToField?.uniqueName || assignedToField?.displayName;
        if (name && topDownMap[itemKey]?.[itemId]?.assignedTo && !topDownMap[itemKey]?.[itemId]?.assignedTo.includes(name)) {
            topDownMap[itemKey]![itemId]!.assignedTo.push(name);
        } else if (!name) {
            console.warn(`Work item ${workItem.id} has no assigned user`, workItem);
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

                    // Propagate the 'assignedTo' list up the tree
                    propagateAssignedTo(topDownMap, itemKey, itemId, parent, parentType);
                }
            }
        }
    }

    return summary;
}

function propagateAssignedTo(topDownMap: TopDownMap, itemKey: WorkItemType, itemId: string, parent: string | undefined, parentType: WorkItemType | undefined) {
    const currentItem = topDownMap[itemKey] && topDownMap[itemKey]![itemId];
    const assignedToList = currentItem ? currentItem.assignedTo : [];
    while (parent && parentType) {
        const currentParentItem = topDownMap[parentType]?.[parent];
        if (!currentParentItem) break;

        for (const assignedTo of assignedToList) {
            if (!currentParentItem.assignedTo.includes(assignedTo)) {
                currentParentItem.assignedTo.push(assignedTo);
            }
        }

        parent = currentParentItem.parent?.id ? String(currentParentItem.parent.id) : undefined;
        parentType = currentParentItem.parent?.workItemType;
    }
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

        console.log(`Getting iteam information of all ${workItemType} (like parents)`);
        const itemsParsed = await GetBatchItemDetails(config, items, fields);
        console.log(`Parsing ${workItemType}s`);
        summary = await ParseItemType(config, itemsParsed, summary);
    });

    await Promise.all(promises);

    console.log("Done parsing all items");
    return summary;
}