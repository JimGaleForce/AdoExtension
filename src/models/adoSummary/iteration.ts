import { ItemParser, ItemSummary } from ".";
import { Iteration } from "../adoApi";
import { WorkItemTags } from "../ItemTag";

export type IterationSummary = {
    iteration: Iteration
    workItemSummaries: ItemSummary<WorkItemTags>[]
}

export type IterationParserExtraData = {
    iteration: Iteration
}

export const GetWorkItemsFromStorageByIteration: (iterationId: string) => Promise<number[]> = (iterationId: string) => {
    return new Promise<number[]>(async (resolve) => {
        const data = await chrome.storage.sync.get([iterationId]);
        resolve(data[iterationId] ?? []);
    }) 
}

export type IterationItemParser = ItemParser<WorkItemTags, IterationParserExtraData>