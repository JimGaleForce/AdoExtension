import { WorkItem, WorkItemHistoryEvent } from "../adoApi"
import { AdoConfigData } from "../adoConfig"
import { BaseTag } from "../ItemTag"

export type ItemSummary<T extends BaseTag> = { 
    id: string
    title: string
    tags: Partial<T>
}

export type ItemParser<T extends BaseTag, U extends {}> = (config: AdoConfigData, workItem: WorkItem, workItemHistoryEvents: WorkItemHistoryEvent[], tags: Partial<T>, extra: U) => Promise<Partial<T>>;