import { BugTag } from './BugTag';
import { CapacityTag } from './CapacityTag';
import { CompletedTag } from './CompletedTag';
import { IgnoreTag } from './IgnoreTag';
import { IterationTrackerTag } from './IterationTrackerTag';
import { ReassignedTag } from './ReassignedTag';
import { WorkItemTypeTag } from './WorkItemTypeTag';

export * from './BaseTag'
export * from './BugTag'
export * from './CapacityTag'
export * from './CompletedTag'
export * from './IterationTrackerTag'

export type KRItemTags =
& WorkItemTypeTag

export type EpicItemTags =
& WorkItemTypeTag

export type ScenarioItemTags =
& CapacityTag
& CompletedTag
& ReassignedTag
& WorkItemTypeTag

export type DeliverableItemTags =
& CapacityTag
& CompletedTag
& ReassignedTag
& WorkItemTypeTag

export type WorkItemTags =
& BugTag
& CapacityTag
& CompletedTag
& IterationTrackerTag
& ReassignedTag
& WorkItemTypeTag
& IgnoreTag