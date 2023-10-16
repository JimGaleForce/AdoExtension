import { BaseTag } from "./BaseTag"

export type ReassignedTimeline = {
    from: string
    to: string
}

export type ReassignedTag = BaseTag & {
    reassigned: {
        from: Set<string>,
        to: string
        timeline: ReassignedTimeline[]
    }
}
