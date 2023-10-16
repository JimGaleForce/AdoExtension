import { WorkItemTags } from "../ItemTag"
import { ItemParser, ItemSummary, TopDownMap } from "./item"

export type DateRangeItemParser = ItemParser<WorkItemTags, {}>

export interface DateRangeSummary { 
    startDate: Date
    endDate: Date
    workItems: {
        [key: string]: ItemSummary<WorkItemTags>
    }
    topDownMap: TopDownMap
}
