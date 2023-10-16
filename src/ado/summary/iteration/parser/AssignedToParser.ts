import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { AssignedToTag } from "../../../../models/ItemTag/AssignedTo";

export const AssignedToParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let assignedToTag: AssignedToTag = {
        assignedTo: []
    }

    let currentAssignedTo = workItem.fields["System.AssignedTo"].uniqueName ?? workItem.fields["System.AssignedTo"].displayName;
    let currentIteration = workItem.fields["System.IterationPath"];

    assignedToTag.assignedTo.push(currentAssignedTo);

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName || historyEvent.fields?.["System.AssignedTo"]?.newValue?.displayName) {
            currentAssignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName ?? historyEvent.fields?.["System.AssignedTo"]?.newValue?.displayName;
        }
        if (historyEvent.fields?.["System.IterationPath"]?.newValue) {
            currentIteration = historyEvent.fields?.["System.IterationPath"]?.newValue;
        }

        if (currentIteration === extra.iteration.path) {
            if (!assignedToTag.assignedTo.includes(currentAssignedTo)) {
                assignedToTag.assignedTo.push(currentAssignedTo);
            }
        }
    }

    return {
        ...tags,
        ...assignedToTag
    };
}