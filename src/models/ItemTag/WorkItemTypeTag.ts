import { WorkItemType } from "../adoApi";
import { BaseTag } from "./BaseTag"

export type WorkItemTypeTag = BaseTag & {
    // currently we only support iterations, so only the first three should show up.
    // in the case that experiments/etc make it into the sprint, just mark it as empty
    workItemType: WorkItemType | string;
}
