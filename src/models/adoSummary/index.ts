import { Iteration, WorkItem } from "../adoApi"
import { TagData, WorkItemTag } from "../ItemTag"

export type ItemSummaryTags<T extends TagData> = {
    [key in T['type']]?: T
}

export type ItemSummary<T extends TagData> = { 
    id: number
    title: string
    tags: ItemSummaryTags<T>
}

export interface IterationSummary {
    iteration: Iteration
    workItems: ItemSummary<WorkItemTag>[]
}

export const GetWorkItemsFromStorageByIteration: (iterationId: string) => Promise<number[]> = (iterationId: string) => {
    return new Promise<number[]>(async (resolve) => {
        const data = await chrome.storage.sync.get([iterationId]);
        resolve(data[iterationId] ?? []);
    }) 
}

export type ItemParser<T extends TagData> = (item: WorkItem, tags: ItemSummaryTags<T>) => Promise<void>;