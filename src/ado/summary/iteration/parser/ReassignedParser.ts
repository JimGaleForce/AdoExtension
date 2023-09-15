import { ReassignedTag } from "../../../../models/ItemTag/ReassignedTag";
import { WorkItemState } from "../../../../models/adoApi";
import { IterationItemParser } from "../../../../models/adoSummary/iteration";

export const ReassignedParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let reassignedTag: ReassignedTag = {
        reassigned: {
            from: new Set(),
            to: "",
            timeline: []
        }
    }

    const isCompletedState: WorkItemState[] = ['Closed', 'Cut', 'Resolved'] 
    let addTag = false;
    let isCompleted = false
    let assignedTo = workItem.fields["System.AssignedTo"].uniqueName

    for (const historyEvent of workItemHistoryEvents) {

        // Grab if this work item was marked as completed
        if (historyEvent.fields?.["System.State"]?.newValue) {
            isCompleted = isCompletedState.indexOf(historyEvent.fields?.["System.State"]?.newValue) !== -1;
        }

        // Ignore this history event if the work item was completed
        if (isCompleted) {
            continue;
        }

        // If the work was not completed, and reassign, tag the relevant users
        if (historyEvent.fields?.["System.AssignedTo"]?.newValue && assignedTo !== historyEvent.fields?.["System.AssignedTo"]?.newValue.uniqueName) {
            const oldAssignedTo = assignedTo;
            assignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue.uniqueName;
            reassignedTag.reassigned.from.add(oldAssignedTo);
            reassignedTag.reassigned.to = assignedTo;
            reassignedTag.reassigned.timeline.push({
                from: oldAssignedTo,
                to: assignedTo,
            });
            addTag = true;
        }
    }

    // Add tag only if something happened
    if (addTag) {
        return {
            ...tags,
            ...reassignedTag
        }
    }

    return tags;
}