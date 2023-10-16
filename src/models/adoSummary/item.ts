import { AdoUser, WorkItem, WorkItemHistoryEvent, WorkItemState, WorkItemType } from "../adoApi"
import { AdoConfigData } from "../adoConfig"
import { BaseTag } from "../ItemTag"

export type ItemSummary<T extends BaseTag> = { 
    id: string
    title: string
    type: WorkItemType
    assignedTo: AdoUser
    state: WorkItemState
    tags: Partial<T>
}

export type ItemParser<T extends BaseTag, U extends {}> = (config: AdoConfigData, workItem: WorkItem, workItemHistoryEvents: WorkItemHistoryEvent[], itemTags: Partial<T>, extra: U) => Promise<Partial<T>>;

export type WorkItemReference = {
    id: string
    workItemType: WorkItemType
}

export type ItemRelation = {
    assignedTo: string[]
    title: string
    type: WorkItemType
    parent?: WorkItemReference
    children?: WorkItemReference[]
};

export type ItemsRelation = {
    [key: string]: ItemRelation
};

export type TopDownMap = {
    [key in WorkItemType]?: ItemsRelation
};