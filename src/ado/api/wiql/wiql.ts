import { ExtractProject, postWithAuth } from "..";
import { WiqlQueryType, WorkItemFields, WorkItemLinksResult, WorkItemsResult } from "../../../models/adoApi";
import { AdoConfigData } from "../../../models/adoConfig";

export type Operator =
    | '='
    | '<>'
    | '<'
    | '>'
    | '<='
    | '>='
    | 'IN'
    | 'NOT IN'
    | 'UNDER'
    | 'EVER'
    | 'CONTAINS'
    | 'NOT CONTAINS'
    | 'IN GROUP'
    | 'NOT IN GROUP'
    | '~'
    | '~='
;

export enum Macro {
    CurrentUser = "@Me",
    CurrentProject = "@Project",
    CurrentIteration = "@currentIteration",
    StartOfDay = "@StartOfDay",
    StartOfWeek = "@StartOfWeek",
    StartOfMonth = "@StartOfMonth",
    StartOfYear = "@StartOfYear",
    Today = "@Today",
}

const valueToQueryString = (value: string | number | string[] | number[]): string => {
    if (typeof value === "string") {
        // If it's a macro, don't wrap it in quotes
        if (value.startsWith("@")) {
            return value;
        }
        return `'${value}'`;
    } else if (typeof value === "number") {
        return `${value}`;
    } else if (Array.isArray(value)) {
        return `(${value.map(v => valueToQueryString(v)).join(", ")})`;
    } else {
        throw new Error(`Unsupported value type ${typeof value}`);
    }
}

export type Mode = "MustContain" | "MayContain" | "DoesNotContain" | "Recursive";

export type Conjunction = "AND" | "OR" | "EVER" | "AND EVER" | "OR EVER";

type ConditionObject<T extends keyof WorkItemFields> = {
    field?: T;
    operator?: Operator;
    value?: string | number | string[] | number[];
    conjunction?:  Conjunction;
    subConditions?: ConditionObject<T>[];
};

type ResultType<T extends WiqlQueryType> = 
    T extends "workitems" ? WorkItemsResult : 
    T extends "workitemLinks" ? WorkItemLinksResult : 
    never;

export class WiqlQueryBuilder<T extends keyof WorkItemFields, K> {
    private _selectFields: T[];
    private _conditions: ConditionObject<T>[] = [];
    private _from: WiqlQueryType;
    private _orderBy?: T;
    private _mode?: Mode

    private constructor(from: WiqlQueryType, selectFields: T[]) {
        this._selectFields = selectFields;
        this._from = from;
    }

    static select<T extends keyof WorkItemFields, U extends WiqlQueryType>(from: U, fields: T[]): WiqlQueryBuilder<T, ResultType<U>> {
        return new WiqlQueryBuilder<T, ResultType<U>>(from, fields);
    }

    condition(field: T, operator: Operator, value: string | number | string[] | number[], conjunction?: Conjunction): this {
        if (this._conditions.length === 0 && conjunction && conjunction !== "EVER") {
            throw new Error("Conjunction (AND/OR) must not be specified for the first condition.");
        }
        this._conditions.push({ field, operator, value, conjunction });
        return this;
    }

    where(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        return this.condition(field, operator, value);
    }

    and(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        return this.condition(field, operator, value, "AND");
    }

    or(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        return this.condition(field, operator, value, "OR");
    }

    ever(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        // Check if conditions already exist, if so, throw an error
        if (this._conditions.length > 0) {
            throw new Error("Cannot use EVER after other conditions. Use at the beginning of query/group, or use AND/OR EVER");
        }
        return this.condition(field, operator, value, "EVER");
    }
    
    andEver(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        return this.condition(field, operator, value, "AND EVER");
    }
    
    orEver(field: T, operator: Operator, value: string | number | string[] | number[]): this {
        return this.condition(field, operator, value, "OR EVER");
    }

    group(conditions: (builder: WiqlQueryBuilder<T, K>) => void, conjunction?: Conjunction): this {
        if (this._conditions.length > 0 && !conjunction) {
            throw new Error("Conjunction (AND/OR) must be specified for groups after the first condition.");
        }
        else if (this._conditions.length == 0 && conjunction) {
            throw new Error("Conjunction (AND/OR) must not be specified for groups during the first condition.");
        }
        const groupBuilder = new WiqlQueryBuilder<T, K>("workitems", []);
        conditions(groupBuilder);
        this._conditions.push({ subConditions: groupBuilder._conditions, conjunction });
        return this;
    }
    
    andGroup(conditions: (builder: WiqlQueryBuilder<T, K>) => void): this {
        return this.group(conditions, "AND");
    }

    orGroup(conditions: (builder: WiqlQueryBuilder<T, K>) => void): this {
        return this.group(conditions, "OR");
    }

    orderBy(field: T) {
        this._orderBy = field;
    }

    mode(mode: Mode) {
        this._mode = mode;
    }

    private buildConditionString(condition: ConditionObject<T>): string {
        if (condition.subConditions) {
            const groupConditions = condition.subConditions.map(c => this.buildConditionString(c)).join(" ");
            return condition.conjunction ? `${condition.conjunction} (${groupConditions})` : `(${groupConditions})`;
        }

        if (condition.field && condition.operator && condition.value) {
            return `${condition.conjunction ? condition.conjunction + " " : ""}[${String(condition.field)}] ${condition.operator} ${valueToQueryString(condition.value)}`;
        }

        return "";
    }

    buildQuery(): string {
        if (this._selectFields.length === 0) {
            throw new Error("No fields specified");
        }
        if (!this._from) {
            throw new Error("FROM not specified");
        }
        if (this._conditions.length === 0) {
            throw new Error("No conditions specified");
        }

        const conditionString = this._conditions.map(c => this.buildConditionString(c)).join(" ");
        return `SELECT ${this._selectFields.map(f => `[${String(f)}]`).join(", ")} FROM ${this._from} WHERE ${conditionString}${this._orderBy ? ` ORDER BY [${this._orderBy}]` : ""}${this._mode ? ` MODE (${this._mode})` : ""}`;
    }

    async execute(config: AdoConfigData): Promise<K> {
        const project = ExtractProject(config);
        const { organization } = config;

        return postWithAuth(`https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=6.0`,
            {
                query: this.buildQuery()
            });
    }
}

// // Example Usage:
// const query = WiqlQueryBuilder
// .select("System.ChangedDate", "System.AreaPath", "System.AssignedTo", "System.Id", "System.IterationPath")
// .from("workitems")
// .where("System.AreaPath", '=', "Edge\\Growth\\Feedback and Diagnostics")
// .and("System.AssignedTo", '<>', Macro.CurrentUser)
// .andGroup(builder => {
//     builder
//         .ever("System.AssignedTo", "=", Macro.CurrentUser)
// })
// .buildQuery() // Optional, but useful for debugging
// .execute(config) // Will build and execute the query
// ;