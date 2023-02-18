import { BugTag } from './BugTag';
import { CapacityTag } from './CapacityTag';
import { CompletedTag } from './CompletedTag';
import { IterationTrackerTag } from './IterationTrackerTag';
import { ReassignedTag } from './ReassignedTag';

export * from './BaseTag'
export * from './BugTag'
export * from './CapacityTag'
export * from './CompletedTag'
export * from './IterationTrackerTag'

export type WorkItemTags =
| BugTag
| CapacityTag
| CompletedTag
| IterationTrackerTag
| ReassignedTag