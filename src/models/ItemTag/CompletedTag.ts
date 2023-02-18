import { BaseTag } from "./BaseTag"

export type CompletedTag = BaseTag & {
    completedByMe?: boolean
}
