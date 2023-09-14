import { IterationFromURL } from "./adoApi"

export type OpenIterationSummaryAction = {
    action: 'OpenIterationSummary'
    iteration: IterationFromURL
}

export type GenerateIterationSummaryAction = {
    action: 'GenerateIterationSummary'
    iterationId: string
    team: string
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