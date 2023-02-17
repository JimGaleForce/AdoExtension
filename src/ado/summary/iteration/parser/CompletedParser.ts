import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { CompletedTag } from "../../../../models/ItemTag/CompletedTag";

export const CompletedParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags) => {
    let completedTag: CompletedTag = {
        completedByMe: false
    }

    for (const historyEvent of workItemHistoryEvents) {
        if (
            historyEvent.revisedBy.uniqueName === config.email &&
            historyEvent.fields?.["System.State"]?.newValue === "Completed"
            ) {
                completedTag.completedByMe = true
            }
        if (
            historyEvent.revisedBy.uniqueName === config.email &&
            historyEvent.fields?.["System.State"]?.newValue !== "Completed"
            ) {
                completedTag.completedByMe = false
            }
    }

    return {
        ...tags,
        ...completedTag
    };
}