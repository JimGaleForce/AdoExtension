import { BaseTag } from "./BaseTag"

export type AssignedToTag = BaseTag & {
    assignedTo: Set<string>;
}
