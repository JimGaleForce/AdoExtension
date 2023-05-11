import { BaseTag } from "./BaseTag"

export type Capacity = {
    timeInitial: number
    timeAdded: number
    timeRemoved: number
    timeLeft: number
}

export type CapacityTag = BaseTag & {
    capacity: Capacity
}