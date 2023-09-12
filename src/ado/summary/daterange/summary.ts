import dayjs from "dayjs";
import { Iteration, WorkItemFields, WorkItemHistory } from "../../../models/adoApi";
import { AdoConfigData, loadConfig } from "../../../models/adoConfig";
import { DateRangeSummary, GetWorkItemsFromStorageByIteration, IterationSummary } from "../../../models/adoSummary";
import { IterationItemParser, IterationParserExtraData } from "../../../models/adoSummary/iteration";
import { WorkItemTags } from "../../../models/ItemTag";
import { GetIteration, GetWorkItem, GetWorkItemHistory } from "../../api";
import { Macro, WiqlQueryBuilder } from "../../api/wiql/wiql";

const DateRangeSummaryParser: IterationItemParser[] = [
    // TitleParser,
    // ReassignedParser,
    // CompletedParser,
    // IterationTrackerParser,
    // WorkItemTypeParser,
    // CapacityParser
]

// Generates a proper ADO Summary for a given date range
export async function SummaryForDateRange(startDate: Date, endDate: Date) {
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
        startDate: startDate,
        endDate: endDate,
        summary: {}
    }

    // Grab Epics and KR's from date range, and work our way down
    const query = WiqlQueryBuilder
        .select("System.ChangedDate", "System.AreaPath", "System.AssignedTo", "System.Id", "System.IterationPath")
        .from("workitems")
        .where("System.AreaPath", '=', "Edge\\Growth\\Feedback and Diagnostics")
        .and("System.AssignedTo", '<>', Macro.CurrentUser)
        .group(builder => {
            builder
                .ever("System.AssignedTo", "=", Macro.CurrentUser)
        }, 'AND')
        ;

    console.log("Query:");
    console.log(query.buildQuery());

    console.log("Result:");
    console.log(await query.execute(config));

    // // We could potentially do a map on `workItemIds` to proceess items
    // // in parallel. This was not initially done due to concerns of hitting
    // // API limits.
    // for (const workItemId of workItemIds) {
    //     const itemSummary = await parseWorkItem(config, iteration, workItemId, startDate, finishDate);
    //     if (itemSummary !== null) {
    //         summary.workItems.push(itemSummary);
    //     }
    // }

    console.log("Summary Done.")
    console.log(summary);
    return summary;
}

// async function parseWorkItem(config: AdoConfigData, iteration: Iteration, workItemId: number, startDateStr: string, finishDateStr: string): Promise<ItemSummary<WorkItemTags> | null> {
//     const startDate = dayjs(startDateStr);
//     const finishDate = dayjs(finishDateStr);

//     let workItemHistory: WorkItemHistory;
//     try {
//         workItemHistory = await GetWorkItemHistory(config, workItemId);
//     } catch {
//         return null;
//     }


//     if (workItemHistory.count === 0 || !workItemHistory.value[0].fields?.["System.AuthorizedDate"]?.newValue) {
//         console.warn(`No history for item ${workItemId}. Skipping`);
//         return null;
//     }

//     // Beacuse the work item may have been made after the sprint started, we need to see when the item was created.
//     // The first item in the work item history is the creation of the item and hence the timestamp of when it was created.
//     // We're going to grab the item as it was either at the start of the iteration, or creation date. Whichever is later.
//     const workItemCreatedAtStr = workItemHistory.value[0].fields?.["System.AuthorizedDate"]?.newValue
//     const workItemCreatedAt = dayjs(workItemCreatedAtStr)
//     const queryDate = workItemCreatedAt.isAfter(startDate) ? workItemCreatedAtStr : startDateStr;
//     const workItem = await GetWorkItem(config, workItemId, queryDate)
//     const extraData: IterationParserExtraData = {
//         iteration: iteration
//     }

//     let tags: Partial<WorkItemTags> = {}
//     // Ignore any events that occured outside of our desired timeframe
//     const relevantHistoryEvents = workItemHistory.value.filter(historyEvent => {
//         const revisedDate = dayjs(historyEvent.fields?.["System.AuthorizedDate"]?.newValue ?? historyEvent.fields?.["System.ChangedDate"]?.newValue)
//         return revisedDate.isAfter(startDate) && revisedDate.isBefore(finishDate)
//     });

//     // Ignore this work item if not relevant to us
//     if (
//         workItem.fields["System.AssignedTo"].uniqueName !== config.email &&
//         !(relevantHistoryEvents.some(
//             historyEvent => historyEvent.fields?.["System.AssignedTo"]?.newValue.uniqueName === config.email
//         ))) {
//         return null;
//     }

//     // Parse the work item using all parsers defined in the IterationSummaryParser.
//     // The parser will update the `workItemSummary.tags` object directly
//     for (const parser of IterationSummaryParser) {
//         tags = await parser(config, workItem, relevantHistoryEvents, tags, extraData);
//     }

//     return {
//         id: workItemId,
//         title: workItem.fields["System.Title"],
//         tags: tags
//     }
// }
