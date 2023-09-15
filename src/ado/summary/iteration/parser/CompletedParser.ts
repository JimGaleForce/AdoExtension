import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { CompletedTag } from "../../../../models/ItemTag/CompletedTag";

export const CompletedParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, _extra) => {
    let completed = false;
    let completedBy = null;
    let assignedTo = workItem.fields["System.AssignedTo"].uniqueName
    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.AssignedTo"]?.newValue) {
            assignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue.uniqueName;
        }
        if (
            (
                historyEvent.fields?.["System.State"]?.newValue === 'Completed' ||
                historyEvent.fields?.["System.State"]?.newValue === 'Resolved' ||
                historyEvent.fields?.["System.State"]?.newValue === 'Closed'
            )
            ) {
                completed = true
                completedBy = assignedTo;
            }
        if (
            historyEvent.fields?.["System.State"]?.newValue &&
            !(
                historyEvent.fields?.["System.State"].newValue === 'Completed' ||
                historyEvent.fields?.["System.State"].newValue === 'Resolved' ||
                historyEvent.fields?.["System.State"].newValue === 'Closed'
            )
            ) {
                completed = false
                completedBy = null;
            }
    }

    if (completed && completedBy) {
        let completedTag: CompletedTag = {
            completedBy
        }
        tags = {
            ...tags,
            ...completedTag
        }
    }
}