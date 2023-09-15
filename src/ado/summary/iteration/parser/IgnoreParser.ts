import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { IgnoreTag } from "../../../../models/ItemTag/IgnoreTag";

export const IgnoreParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let ignoreTag: IgnoreTag = {
        // If the work item is not in the iteration at the beginning of the sprint / creation, ignore it by default
        ignore: workItem.fields["System.IterationPath"] !== extra.iteration.path,
    }

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue === extra.iteration.path) {

            // If the work item was moved into the iteration during the iteration, it should not be ignored 
            ignoreTag.ignore = false;
        }
    }

    if (ignoreTag.ignore) {
        return {
            ...tags,
            ...ignoreTag,
        };
    }

    return tags;
}
