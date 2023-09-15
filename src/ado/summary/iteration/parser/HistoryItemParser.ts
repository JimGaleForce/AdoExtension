import { IterationItemParser } from "../../../../models/adoSummary/iteration";

export const HistoryItemParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {
    for (const historyEvent of workItemHistoryEvents) {
        if (!historyEvent.fields) continue;

        for (const field in historyEvent.fields) {
            if (historyEvent.fields[field]?.newValue ) {
                workItem.fields[field] = historyEvent.fields[field]?.newValue ?? workItem.fields[field];
            }
        }
    }
}