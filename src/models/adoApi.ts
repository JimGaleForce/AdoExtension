type StringKeys<T> = Extract<keyof T, string>;

export type Patch<T> = {
    op: 'add' | 'remove' | 'replace'
    path: `/fields/${StringKeys<T>}`;
    value: any
}

export type Timeframe = "past" | "current" | "future"

export type Href = {
    href: string
}

export type TeamFieldValues = {
    field: {
        referenceName: string
        url: string
    },
    defaultValue: string
    values: {
        value: string
        includeChildren: boolean   
    }[],
    url: string,
    links: {
        self: Href,
        project: Href,
        team: Href,
        teamSettings: Href,
        areaPathClassificationNodes: Href
    }
}

export type IterationFromURL = {
    organization: string
    project: string
    team: string
    iteration: string
}

export type Iteration = {
    id: string
    name: string
    path: string
    attributes: {
        startDate: string
        finishDate: string
        timeFrame: Timeframe
    }
    url: string
    _links?: {
        self?: Href
        project?: Href
        team?: Href
        teamSettings?: Href
        teamIterations?: Href
        capacity?: Href
        workitems?: Href
        classificationNode?: Href
        teamDaysOff?: Href
    }
}

export type ListIteration = {
    count: number
    value: Iteration[]
}

export enum BacklogId {
    "Scenarios and Impediments" = "OSG.ScenarioCategory",
    "Epics and Key Results" = "Microsoft.FeatureCategory",
    "Customer Promises and Objectives" = "OSG.CustomerPromiseCategory",
    "Deliverables" = "Microsoft.RequirementCategory",
    "Tasks" = "Microsoft.TaskCategory",
}

export type BacklogWorkItemType = {
    name: string
    url: string
}

export type Backlog = {
    id: string
    name: string
    rank: number
    isHidden: boolean
    workItemCountLimit: number
    type: string
    workItemTypes: BacklogWorkItemType[]
}

export type BacklogList = {
    count: number
    value: Backlog[]
}

export type BacklogWorkItems = {
    workItems: WorkItemRelation[]
}

export type WiqlQueryType = "workitems" | "workitemLinks";
export type WorkItemsResult = {
    asOf: string,
    columns: {
        referenceName: string,
        name: string,
        url: string
    }[],
    queryResultType: WiqlQueryType,
    queryType: string,
    workItems: WorkItemResult[]
}

export type WorkItemResult = {
    id: string,
    url: string
}

export type WorkItemLinksResult = {
}

export type WorkItemRelation = {
    rel: undefined | null | string
    source: undefined | null | string
    target: {
        id: number
        url: null | string
    }

}

export type IterationWorkItems = {
    workItemRelations: WorkItemRelation[]
    url: string
    _links: {
        self?: Href
        project?: Href
        team?: Href
        teamIteration?: Href
    }
}

export type WorkItemState = 
    | "Active"
    | "Committed"
    | "Completed"
    | "Cut"
    | "Proposed"
    | "Started"
    | "Removed"
    | "Resolved"
    | "Closed"

export type WorkItemType =
    | "Bug"
    | "Deliverable"
    | "Epic"
    | "Experiment"
    | "Feature"
    | "Key Result"
    | "Scenario"
    | "Task"

export type AdoUser = {
    displayName: string
    url: string
    id: string
    uniqueName: string
    imageUrl: string
    descriptor: string
    _links: {
        avatar: Href
    }
}

export type WorkItemFields = {
    "System.Id": number
    "System.AreaPath": string
    "System.TeamProject": string
    "System.IterationPath": string
    "System.WorkItemType": WorkItemType
    "System.State": WorkItemState
    "System.Reason": string
    "System.AssignedTo": AdoUser
    "System.CreatedDate": string
    "System.CreatedBy": AdoUser
    "System.ChangedDate": string
    "System.ChangedBy": AdoUser

    "System.CommentCount": number
    "System.Title": string
    "System.IsDeleted": boolean

    "System.Parent"?: number
    "Microsoft.VSTS.Scheduling.OriginalEstimate"?: number
    "Microsoft.VSTS.Scheduling.RemainingWork"?: number
    "OSG.RemainingDays"?: number
    "OSG.RemainingDevDays"?: number
    "OSG.Cost"?: number
}


export type WorkItem<T extends keyof WorkItemFields = keyof WorkItemFields> = {
    id: number
    rev: number
    fields: Pick<WorkItemFields, T>
    _links: {
        self?: Href
        workItemUpdates?: Href
        workItemRevisions?: Href
        workItemComments?: Href
        html?: Href
        workItemType?: Href
        fields?: Href
        parent?: Href
    }
    url: string
}

export type BatchWorkItems = {
    count: number
    value: WorkItem[]
}


export type FieldUpdateDelta<T> = T extends null | undefined ? never : {
    newValue: T
    oldValue: T | null | undefined
}

export type Relation = {
    rel: string
    url: string
    attributes: {
        [key: string]: unknown
    }
}

export type WorkItemHistoryEvent = {
    id: number
    workItemId: number
    rev: number
    revisedBy: AdoUser
    revisedDate: string
    url: string
    fields?: {
        // Catch all
        [key: string]: FieldUpdateDelta<unknown> | undefined

        "System.Id"?: FieldUpdateDelta<number>
        "System.AreaId"?: FieldUpdateDelta<number>
        "System.NodeName"?: FieldUpdateDelta<string>
        "System.AreaLevel1"?: FieldUpdateDelta<string>
        "System.AreaLevel2"?: FieldUpdateDelta<string>
        "System.AreaLevel3"?: FieldUpdateDelta<string>
        "System.Rev"?: FieldUpdateDelta<number>
        "System.AuthorizedDate"?: FieldUpdateDelta<string>
        "System.RevisedDate"?: FieldUpdateDelta<string>
        "System.IterationId"?: FieldUpdateDelta<number>
        "System.IterationLevel1"?: FieldUpdateDelta<string>
        "System.IterationLevel2"?: FieldUpdateDelta<string>
        "System.IterationLevel3"?: FieldUpdateDelta<string>
        "System.WorkItemType"?: FieldUpdateDelta<string>
        "System.State"?: FieldUpdateDelta<WorkItemState>
        "System.Reason"?: FieldUpdateDelta<string>
        "System.AssignedTo"?: FieldUpdateDelta<AdoUser>
        "System.CreatedDate"?: FieldUpdateDelta<string>
        "System.CreatedBy"?: FieldUpdateDelta<AdoUser>
        "System.ChangedDate"?: FieldUpdateDelta<string>
        "System.ChangedBy"?: FieldUpdateDelta<AdoUser>
        "System.AuthorizedAs"?: FieldUpdateDelta<AdoUser>
        "System.IsDeleted"?: FieldUpdateDelta<boolean>
        "System.CommentCount"?: FieldUpdateDelta<number>
        "System.TeamProject"?: FieldUpdateDelta<string>
        "System.AreaPath"?: FieldUpdateDelta<string>
        "System.IterationPath"?: FieldUpdateDelta<string>
        "OSG.ProductFamily"?: FieldUpdateDelta<string>
        "OSG.FuncSpecStatus"?: FieldUpdateDelta<string>
        "OSG.DevDesignStatus"?: FieldUpdateDelta<string>
        "OSG.Product"?: FieldUpdateDelta<string>
        "OSG.Partner.AssignedBack"?: FieldUpdateDelta<string>
        "OSG.Tenets.EnforcementStatus"?: FieldUpdateDelta<string>
        "System.Description"?: FieldUpdateDelta<string>
        "System.Title"?: FieldUpdateDelta<string>
        "OSG.Tenets.ComplianceAssessmentState"?: FieldUpdateDelta<string>

        "Microsoft.VSTS.Scheduling.OriginalEstimate"?: FieldUpdateDelta<number>
        "OSG.RemainingDays"?: FieldUpdateDelta<number>
        "OSG.Cost"?: FieldUpdateDelta<number>
    }
    relations?: {
        added?: Relation
        removed?: Relation
    }
}

export type WorkItemHistory = {
    count: number
    value: WorkItemHistoryEvent[]
}