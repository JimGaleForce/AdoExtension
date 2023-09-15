import { WorkItemState } from "../../../../models/adoApi";
import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { IterationTrackerTag } from "../../../../models/ItemTag";

export const IterationTrackerParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let iterationTrackerTag: IterationTrackerTag = {
        // If the work item is not in the iteration at the beginning of the sprint / creation, ignore it by default
        ignore: workItem.fields["System.IterationPath"] !== extra.iteration.path,
        moved: {
            intoIteration: false,
            outOfIteration: false
        }
    }

    const isCompletedState: WorkItemState[] = ['Closed', 'Cut', 'Resolved', 'Completed']
    let isCompleted = false;

    for (const historyEvent of workItemHistoryEvents) {
        // Mark if the task was marked as completed
        if (historyEvent.fields?.["System.State"]?.newValue) {
            isCompleted = isCompletedState.indexOf(historyEvent.fields?.["System.State"]?.newValue) !== -1;
        }

        if (historyEvent.fields?.["System.IterationPath"]?.oldValue &&
            historyEvent.fields?.["System.IterationPath"]?.oldValue === extra.iteration.path &&
            historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue !== extra.iteration.path) {
            iterationTrackerTag.moved.outOfIteration = true
        }
        if (historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue === extra.iteration.path) {
            iterationTrackerTag.moved.intoIteration = true
            
            // If the work item was moved into the iteration during the iteration, it should not be ignored 
            iterationTrackerTag.ignore = false;
        }
    }

    // Was moved out, but moved back in and finished, so not accurate to call this punted.
    if (isCompleted) {
      iterationTrackerTag.moved.outOfIteration = false;
    }

    tags = {
        ...tags,
        ...iterationTrackerTag,
    };
}
