import { BugTag } from './BugTag';
import { CapacityTag } from './CapacityTag';
import { CompletedTag } from './CompletedTag';
import { ReassignedTag } from './ReassignedTag';

export * from './BaseTag'
export * from './BugTag'
export * from './CapacityTag'

export type WorkItemTags =
| BugTag
| CapacityTag
| CompletedTag
| ReassignedTag