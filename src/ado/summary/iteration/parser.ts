import { IterationItemParser } from "../../../models/adoSummary/iteration";

export const CapacityParser: IterationItemParser = async (item, tags) => {
    if (item.id == 1) {
        return {
            ...tags,
            bugStatus: 'Proposed'
        }
    } else {
        return tags;
    }
}