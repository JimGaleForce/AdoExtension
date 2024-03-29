import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { CompletedTag } from "../../../../models/ItemTag/CompletedTag";

export const CompletedParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, _extra) => {
    let completedBy = null;
    let addTag = false;
    let assignedTo = workItem.fields["System.AssignedTo"]
    for (const historyEvent of workItemHistoryEvents) {
        if (
            historyEvent.fields?.["System.AssignedTo"]?.newValue && 
            historyEvent.fields?.["System.State"]?.newValue !== 'Resolved' &&
            historyEvent.fields?.["System.State"]?.newValue !== 'Closed'
        ) {
            assignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue;
        }
        if (
                historyEvent.fields?.["System.State"]?.newValue === 'Completed' ||
                historyEvent.fields?.["System.State"]?.newValue === 'Resolved'
            ) {
                completedBy = assignedTo;
                addTag = true;
            }
        if (
            historyEvent.fields?.["System.State"]?.newValue &&
            !(
                historyEvent.fields?.["System.State"].newValue === 'Completed' ||
                historyEvent.fields?.["System.State"].newValue === 'Resolved' ||
                historyEvent.fields?.["System.State"].newValue === 'Closed'
            )
            ) {
                completedBy = null;
                addTag = false
            }
    }

    // Only add tag if something happened
    if (addTag && completedBy) {
        let completedTag: CompletedTag = {
            completedBy
        }
        return {
            ...tags,
            ...completedTag
        }
    }

    return tags;
}