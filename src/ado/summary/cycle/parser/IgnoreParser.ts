import { CycleItemParser } from "../../../../models/adoSummary/cycle";
import { IgnoreTag } from "../../../../models/ItemTag/IgnoreTag";

export const IgnoreParser: CycleItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let ignoreTag: IgnoreTag = {
        // If the work item is not in the iteration at the beginning of the sprint / creation, ignore it by default
        ignore: (workItem.fields["System.IterationPath"].indexOf(extra.cycle) === -1 || workItem.fields["System.State"] == "Proposed"),
    }

    let inCycle = workItem.fields["System.IterationPath"].indexOf(extra.cycle) === -1;
    let committed = workItem.fields["System.State"] !== "Proposed";
    let committedInCycle = inCycle && committed;

    for (const historyEvent of workItemHistoryEvents) {        
        if (historyEvent.fields?.["System.IterationPath"]?.newValue) {
            inCycle = historyEvent.fields?.["System.IterationPath"].newValue.indexOf(extra.cycle) !== -1;
        }

        if (historyEvent.fields?.["System.State"]?.newValue &&
            historyEvent.fields?.["System.State"]?.newValue !== "Proposed") {
            committed = true;
        }

        if (!committedInCycle && inCycle && committed) {
            committedInCycle = true;
        }
    }
    
    if (committedInCycle) {
        // If the work item was moved into the iteration during the cycle as committed, it should not be ignored 
        ignoreTag.ignore = false;
    }

    if (ignoreTag.ignore) {
        return {
            ...tags,
            ...ignoreTag,
        };
    }

    return tags;
}
