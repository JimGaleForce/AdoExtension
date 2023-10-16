import { AdoUser } from "../adoApi"
import { BaseTag } from "./BaseTag"

export type CompletedTag = BaseTag & {
    completedBy: AdoUser
}
