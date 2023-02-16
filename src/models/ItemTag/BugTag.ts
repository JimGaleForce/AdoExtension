import { TagData } from "./TagData"

export type BugTag = TagData & {
    type: 'bug'
    foo: string
}

export function isBugTag(tag: TagData): tag is BugTag {
    return (tag as BugTag).type === 'bug'
}
