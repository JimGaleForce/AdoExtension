import { BaseTag } from "./BaseTag"

export type IterationTrackerTag = BaseTag & {
    ignore: boolean,
    moved: {
        intoIteration: boolean,
        outOfIteration: boolean
    }
}
