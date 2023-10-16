import { DateRangeItemParser } from "../../../../models/adoSummary";
import { WorkItemTypeTag } from "../../../../models/ItemTag/WorkItemTypeTag";

export const WorkItemTypeParser: DateRangeItemParser = async (_config, _workItem, workItemHistoryEvents, tags, _extra) => {
  let workItemTypeTag: WorkItemTypeTag = {
    // @ts-ignore this may be an undefined work item type, but that's okay
    workItemType: _workItem.fields["System.WorkItemType"]
  }

  for (const historyEvent of workItemHistoryEvents) {
    if (historyEvent.fields?.["System.WorkItemType"]?.newValue) {
      // @ts-ignore this may be an undefined work item type, but that's okay
      workItemTypeTag.workItemType = historyEvent.fields?.["System.WorkItemType"]?.newValue;
    }
  }

  return {
    ...tags,
    ...workItemTypeTag
  };
}
