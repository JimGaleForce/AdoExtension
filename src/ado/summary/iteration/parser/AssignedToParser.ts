import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { AssignedToTag } from "../../../../models/ItemTag/AssignedTo";

export const AssignedToParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let assignedToTag: AssignedToTag = {
        assignedTo: new Set<string>()            
    }

    let currentAssignedTo = workItem.fields["System.AssignedTo"].uniqueName;
    let currentIteration = workItem.fields["System.IterationPath"];


    if (currentIteration === extra.iteration.path) {
        assignedToTag.assignedTo.add(currentAssignedTo);
        console.log(`Adding ${currentAssignedTo} to ${workItem.id} ${workItem.fields["System.Title"]}`)
    }

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName) {
            currentAssignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue?.uniqueName;
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