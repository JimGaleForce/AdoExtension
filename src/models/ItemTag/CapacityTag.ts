import { BaseTag } from "./BaseTag"

export type CapacityImpact = {
    timeAdded: number;
    timeCompleted: number;
}

export type Capacity = {
    timeInitial: number
    timeAdded: number
    timeRemoved: number
    timeLeft: number
    capacityImpact: {
        [key: string]: CapacityImpact
    }
}

export type CapacityTag = BaseTag & {
    capacity: Capacity
}