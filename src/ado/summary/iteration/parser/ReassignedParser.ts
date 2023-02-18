import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { ReassignedTag } from "../../../../models/ItemTag/ReassignedTag";

export const ReassignedParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let reassignedTag: ReassignedTag = {
        reassigned: {
            toMe: false,
            fromMe: false,
            timeline: []
        }
    }

    let assignedToMe = workItem.fields["System.AssignedTo"].uniqueName === config.email;

    for (const historyEvent of workItemHistoryEvents) {
        const newAssignedTo = historyEvent.fields?.["System.AssignedTo"]?.newValue.uniqueName;
        if (!newAssignedTo) {
            continue;
        }

        if (assignedToMe && newAssignedTo !== config.email) {
            assignedToMe = false;
            reassignedTag.reassigned.fromMe = true;
            reassignedTag.reassigned.timeline.push({
                date: historyEvent.fields?.["System.AuthorizedDate"]?.newValue ?? historyEvent.revisedDate,
                fromMe: true,
                toMe: false
            });
        }

        if (!assignedToMe && newAssignedTo === config.email) {
            assignedToMe = true;
            reassignedTag.reassigned.toMe = true;
            reassignedTag.reassigned.timeline.push({
                date: historyEvent.fields?.["System.AuthorizedDate"]?.newValue ?? historyEvent.revisedDate,
                fromMe: false,
                toMe: true
            });
        }
    }

    return {
        ...tags,
        ...reassignedTag
    };
}