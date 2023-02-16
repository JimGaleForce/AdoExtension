import { BugTag } from './BugTag';
import { CapacityTag } from './CapacityTag';

export * from './TagData'
export * from './BugTag'
export * from './CapacityTag'

export type WorkItemTag =
| BugTag
| CapacityTag