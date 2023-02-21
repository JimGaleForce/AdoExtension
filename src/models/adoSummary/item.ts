import { WorkItem } from "../adoApi"
import { BaseTag } from "../ItemTag"

export type ItemSummary<T extends BaseTag> = { 
    id: number
    title: string
    tags: T
}

export type ItemParser<T extends BaseTag> = (item: WorkItem, tags: T) => Promise<void>;