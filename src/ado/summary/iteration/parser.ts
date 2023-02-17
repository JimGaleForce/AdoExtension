import { IterationItemParser } from "../../../models/adoSummary/iteration";

export const CapacityParser: IterationItemParser = async (workItem, workItemHistory, tags) => {
    
    // Sample code looking at work item
    if (workItem.id == 1) {
        return {
            ...tags,
            bugStatus: 'Proposed'
        }
    }

    // Sample code looking at the work items history
    if (workItemHistory.value.some(event => {
        event.fields?.["System.IsDeleted"] ?? false
    })) {
        // Item is deleted?
        return tags
    }

    return tags;
}