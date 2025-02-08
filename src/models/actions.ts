import { IterationFromURL } from "./adoApi"

export type OpenCycleSummaryAction = {
    action: 'OpenCycleSummary'
    cycle: IterationFromURL
}

export type GenerateCycleSummaryAction = {
    action: 'GenerateCycleSummary'
    cycle: string
    team: string
}

export type OpenIterationSummaryAction = {
    action: 'OpenIterationSummary'
    iteration: IterationFromURL
}

export type GenerateIterationSummaryAction = {
    action: 'GenerateIterationSummary'
    iterationId: string
    team: string
}

export type GenerateDateRangeSummaryAction = {
    action: 'GenerateDateRangeSummary'
    from: string
    to: string
    teamReport: boolean
}

export type RenumberBacklogAction = {
    action: 'RenumberBacklog'
}

export type BGAction =
    | OpenCycleSummaryAction
    | GenerateCycleSummaryAction
    | OpenIterationSummaryAction
    | GenerateIterationSummaryAction
    | GenerateDateRangeSummaryAction
    | RenumberBacklogAction

export function isBGAction(item: any): item is BGAction {
    if ((item as BGAction).action) {
        return true;
    }

    return false;
}