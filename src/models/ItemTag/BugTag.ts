import { BaseTag } from "./BaseTag"

export type BugTag = BaseTag & {
    bugStatus: 'Resolved' | 'Proposed'
}
