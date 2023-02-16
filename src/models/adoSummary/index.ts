import { Iteration, WorkItem } from "../adoApi"
import { BaseTag, WorkItemTags } from "../ItemTag"

export type ItemSummary<T extends BaseTag> = { 
    id: number
    title: string
    tags: Partial<T>
}

export interface IterationSummary {
    iteration: Iteration
    workItems: ItemSummary<WorkItemTags>[]
}

export const GetWorkItemsFromStorageByIteration: (iterationId: string) => Promise<number[]> = (iterationId: string) => {
    return new Promise<number[]>(async (resolve) => {
        const data = await chrome.storage.sync.get([iterationId]);
        resolve(data[iterationId] ?? []);
    }) 
}

export type ItemParser<T> = (item: WorkItem, tags: T) => Promise<void>;