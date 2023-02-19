import { BaseTag } from "./BaseTag"

export type Capacity = {
    timeAdded: number
    timeRemoved: number
}

export type CapacityTag = BaseTag & {
    capacity: Capacity
}