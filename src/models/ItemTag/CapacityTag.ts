import { TagData } from "./TagData"

export type CapacityTag = TagData &  {
    type: 'capacity'
    bar: string
}

export function isCapacityTag(tag: TagData): tag is CapacityTag {
    return (tag as CapacityTag).type === 'capacity'
}