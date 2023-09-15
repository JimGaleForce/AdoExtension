import { BaseTag } from "./BaseTag"

export type CompletedTag = BaseTag & {
    completedBy: string
}
