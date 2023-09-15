import { IterationItemParser } from "../../../../models/adoSummary/iteration";
import { CapacityTag } from "../../../../models/ItemTag";

export const CapacityParser: IterationItemParser = async (config, _workItem, workItemHistoryEvents, tags, _extra) => {
    let capacityTag: CapacityTag = {
        capacity: {
            timeInitial: _workItem.fields["OSG.RemainingDays"] ?? 0,
            timeAdded: 0,
            timeRemoved: 0,
            timeLeft: _workItem.fields["OSG.RemainingDays"] ?? 0,
            capacityImpact: {}
        }
    }

    for (const historyEvent of workItemHistoryEvents) {

        // If remaining days was updated
        if (historyEvent.fields?.["OSG.RemainingDays"]) {
            const { newValue, oldValue } = historyEvent.fields["OSG.RemainingDays"];

            // If we had remaining time, and it decreased, count that as time removed
            if (oldValue && newValue < oldValue) {
                capacityTag.capacity.timeRemoved += oldValue - newValue;
            }

            // If we didn't have remaining time and set one, or we added time, count that as time added.
            if (!oldValue || newValue > oldValue) { 
                capacityTag.capacity.timeAdded += newValue - (oldValue ?? 0)
            }

            // If we have remaining time, set it as time left. This will be overwritten until it's accurate
            capacityTag.capacity.timeLeft = newValue;
        }
    }

    tags = {
        ...tags,
        ...capacityTag
    };
}