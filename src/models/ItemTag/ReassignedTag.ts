import { BaseTag } from "./BaseTag"

export type ReassignedTag = BaseTag & {
    reassignedToMe: boolean
    reassignedOffOfMe: boolean
}
