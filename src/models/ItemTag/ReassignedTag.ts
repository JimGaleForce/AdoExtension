import { BaseTag } from "./BaseTag"

export type ReassignedTag = BaseTag & {
    reassigned: {
        toMe: boolean,
        fromMe: boolean
    }
}
