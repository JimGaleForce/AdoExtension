import { WorkItem } from "../../../models/adoApi";
import { WorkItemTags } from "../../../models/ItemTag";

export const CapacityParser: (item: WorkItem, tags: Partial<WorkItemTags>) => Partial<WorkItemTags> = (item, tags) => {
    if (item.id == 1) {
        return {
            ...tags,
            bugStatus: 'Proposed'
        }
    } else {
        return tags;
    }
}