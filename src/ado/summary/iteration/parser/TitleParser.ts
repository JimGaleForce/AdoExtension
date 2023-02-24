import { IterationItemParser } from "../../../../models/adoSummary/iteration";

export const TitleParser: IterationItemParser = async (config, workItem, workItemHistoryEvents, tags, extra) => {

    for (const historyEvent of workItemHistoryEvents) {
        if (historyEvent.fields?.["System.Title"]?.newValue) { 
            workItem.fields["System.Title"] = historyEvent.fields?.["System.Title"]?.newValue;
        }
    }

    return tags;
}