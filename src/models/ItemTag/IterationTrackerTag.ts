import { BaseTag } from "./BaseTag"

export type IterationTrackerTag = BaseTag & {
    moved: {
        intoIteration: boolean,
        outOfIteration: boolean
    }
}
