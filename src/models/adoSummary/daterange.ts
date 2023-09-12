import { WiqlQueryBuilder } from "../../ado/api/wiql/wiql"
import { KRItemTags, EpicItemTags, ScenarioItemTags, DeliverableItemTags, WorkItemTags } from "../ItemTag"
import { WorkItemFields } from "../adoApi"
import { ItemSummary } from "./item"

export interface DateRangeSummary { 
    startDate: Date
    endDate: Date
    summary: {
        krSummary?: ItemSummary<KRItemTags>[]
        epicSummary?: ItemSummary<EpicItemTags>[]
        scenarioSummary?: ItemSummary<ScenarioItemTags>[]
        deliverableSummary?: ItemSummary<DeliverableItemTags>[]
        workItemSummary?: ItemSummary<WorkItemTags>[]
    }
}

// export const GeKRsByDateRange: (startDate: Date, endDate: Date) => Promise<number[]> = (iterationId: string) => {
//     return new Promise<number[]>(async (resolve) => {
//         const wiqlBuilder = WiqlQueryBuilder.createWiql<WorkItemFields>("WorkItem");
//         const wiql2 = await wiqlBuilder
//         resolve(data);
//     }) 
// }