import { Iteration } from "./adoApi"

export type OpenIterationSummaryAction = {
    action: 'OpenIterationSummary'
    iteration: Iteration
}

export type GenerateIterationSummaryAction = {
    action: 'GenerateIterationSummary'
    iterationId: string
}

export type BGAction =
    | OpenIterationSummaryAction
    | GenerateIterationSummaryAction

export function isBGAction(item: any): item is BGAction {
    if ((item as BGAction).action) {
        return true;
    }

    return false;
}