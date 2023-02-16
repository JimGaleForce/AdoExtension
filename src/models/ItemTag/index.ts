import { BugTag } from './BugTag';
import { CapacityTag } from './CapacityTag';

export * from './BaseTag'
export * from './BugTag'
export * from './CapacityTag'

export type WorkItemTags =
| BugTag
| CapacityTag