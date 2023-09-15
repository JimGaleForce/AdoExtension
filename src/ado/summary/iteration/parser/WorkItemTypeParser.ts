import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { WorkItemTypeTag } from "../../../../models/ItemTag/WorkItemTypeTag";

export const WorkItemTypeParser: IterationItemParser = async (config, _workItem, workItemHistoryEvents, tags, _extra) => {
  let workItemTypeTag: WorkItemTypeTag = {
    workItemType: _workItem.fields["System.WorkItemType"]
  }

  for (const historyEvent of workItemHistoryEvents) {
    if (historyEvent.fields?.["System.WorkItemType"]?.newValue) {
      workItemTypeTag.workItemType = historyEvent.fields?.["System.WorkItemType"]?.newValue;
    }
  }

  tags = {
    ...tags,
    ...workItemTypeTag
  };
}
