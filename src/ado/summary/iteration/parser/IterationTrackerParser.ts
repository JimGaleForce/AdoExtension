import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { IterationTrackerTag } from "../../../../models/ItemTag";

export const IterationTrackerParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let iterationTrackerTag: IterationTrackerTag = {
        moved: {
            intoIteration: false,
            outOfIteration: false
        }
    }

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.IterationPath"]?.oldValue &&
            historyEvent.fields?.["System.IterationPath"]?.oldValue === extra.iteration.path &&
            historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue !== extra.iteration.path) {
            iterationTrackerTag.moved.outOfIteration = true
        }
        if (historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue === extra.iteration.path) {
            iterationTrackerTag.moved.intoIteration = true
        }
    }

    return {
        ...tags,
        ...iterationTrackerTag,
    };
}