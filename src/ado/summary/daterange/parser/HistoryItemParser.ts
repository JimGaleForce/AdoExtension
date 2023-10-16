import { DateRangeItemParser } from "../../../../models/adoSummary";

export const HistoryItemParser: DateRangeItemParser = async (_config, workItem, workItemHistoryEvents, tags, _extra) => {
    for (const historyEvent of workItemHistoryEvents) {
        if (!historyEvent.fields) continue;

        for (const field in historyEvent.fields) {
            if (historyEvent.fields[field]?.newValue ) {
                // @ts-ignore field could be an arbitrary string which is okay
                workItem.fields[field] = historyEvent.fields[field]?.newValue ?? workItem.fields[field];
            }
        }
    }

    return tags;
}