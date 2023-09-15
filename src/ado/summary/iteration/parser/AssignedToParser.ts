import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { AssignedToTag } from "../../../../models/ItemTag/AssignedTo";

export const AssignedToParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let assignedToTag: AssignedToTag = {
        assignedTo: new Set<string>()            
    }

    let currentAssignedTo = workItem.fields["System.AssignedTo"].uniqueName ?? workItem.fields["System.AssignedTo"].displayName;
    let currentIteration = workItem.fields["System.IterationPath"];


    if (currentIteration === extra.iteration.path) {
        assignedToTag.assignedTo.add(currentAssignedTo);
    }

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName || historyEvent.fields?.["System.AssignedTo"]?.newValue?.displayName) {
            currentAssignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName ?? historyEvent.fields?.["System.AssignedTo"]?.newValue?.displayName;
        }
        if (historyEvent.fields?.["System.IterationPath"]?.newValue) {
            currentIteration = historyEvent.fields?.["System.IterationPath"]?.newValue;
        }

        if (currentIteration === extra.iteration.path) {
            assignedToTag.assignedTo.add(currentAssignedTo);
        }
    }

    return {
        ...tags,
        ...assignedToTag
    };
}