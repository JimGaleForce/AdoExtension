import { WorkItemState } from "../../../../models/adoApi";
import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { IterationTrackerTag } from "../../../../models/ItemTag";

export const IterationTrackerParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    let iterationTrackerTag: IterationTrackerTag = {
        moved: {
            intoIteration: false,
            outOfIteration: false
        }
    }

    const isCommittedState: WorkItemState[] = ['Committed', 'Started']
    const isCompletedState: WorkItemState[] = ['Closed', 'Cut', 'Resolved', 'Completed']
    let isCompleted = false;

    let currentIteration = workItem.fields["System.IterationPath"];

    // Mark if the task was ever committed in the current sprint during the sprint
    let wasEverCommitted = isCommittedState.indexOf(workItem.fields["System.State"]) !== -1 && currentIteration === extra.iteration.path;

    for (const historyEvent of workItemHistoryEvents) {
        // Mark if the task was marked as completed
        if (historyEvent.fields?.["System.State"]?.newValue) {
            isCompleted = isCompletedState.indexOf(historyEvent.fields?.["System.State"]?.newValue) !== -1;
        }

        // Update the current iteration if it was changed
        if (
            historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue !== currentIteration) {
            currentIteration = historyEvent.fields?.["System.IterationPath"].newValue;
        }

        // If the work was ever marked as committed in the current sprint during the sprint
        if (historyEvent.fields?.["System.State"]?.newValue &&
            isCommittedState.indexOf(historyEvent.fields?.["System.State"]?.newValue) !== -1 &&
            currentIteration === extra.iteration.path) {
            wasEverCommitted = true;
        }


        if (historyEvent.fields?.["System.IterationPath"]?.oldValue &&
            historyEvent.fields?.["System.IterationPath"]?.oldValue === extra.iteration.path &&
            historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue !== extra.iteration.path) {
            // Only mark the task as punted if it was ever committed in the sprint during the sprint
            if (wasEverCommitted) {
                iterationTrackerTag.moved.outOfIteration = true
            }
        }
        if (historyEvent.fields?.["System.IterationPath"]?.newValue &&
            historyEvent.fields?.["System.IterationPath"].newValue === extra.iteration.path) {

            // Only mark the task as brought in if it was brought in and committed.
            if (wasEverCommitted) {
                iterationTrackerTag.moved.intoIteration = true
            }
        }
    }

    // Was moved out, but moved back in and finished, so not accurate to call this punted.
    if (isCompleted) {
        iterationTrackerTag.moved.outOfIteration = false;
    }

    const addTag = iterationTrackerTag.moved.intoIteration || iterationTrackerTag.moved.outOfIteration;

    if (addTag) {
        return {
            ...tags,
            ...iterationTrackerTag,
        };
    }

    return tags;
}
