import { BaseTag } from "./BaseTag"

export type ReassignedTimeline = {
    date: string
    toMe: boolean
    fromMe: boolean
}

export type ReassignedTag = BaseTag & {
    reassigned?: {
        toMe: boolean,
        fromMe: boolean
        timeline: ReassignedTimeline[]
    }
}
