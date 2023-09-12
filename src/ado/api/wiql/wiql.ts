import { ExtractProject, postWithAuth } from "..";
import { WorkItemFields } from "../../../models/adoApi";
import { AdoConfigData } from "../../../models/adoConfig";

type Operator =
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

type From = "workitems" | "workitemLinks";

export class WiqlQueryBuilder<T extends keyof WorkItemFields> {
    private _selectFields: T[];
    private _conditions: string[] = [];
    private _from?: From;

    private createCondition(field: T, operator: Operator, value: any, prefix?: string): string {
        const condition = `[${String(field)}] ${operator} ${valueToQueryString(value)}`;
        if (prefix) {
            return `${prefix} ${condition}`;
        }
        return condition;
    }
    
    private appendCondition(condition: string, conjunction?: string): this {
        if (conjunction) {
            if ((conjunction === 'AND' || conjunction === 'OR') && this._conditions.length === 0) {
                throw new Error(`Cannot use ${conjunction} before WHERE`);
            }
            this._conditions.push(`${conjunction} ${condition}`);
        } else {
            this._conditions.push(condition);
        }
        return this;
    }

    private group(callback: (builder: WiqlQueryBuilder<T>) => void, conjunction?: string): this {
        const groupedBuilder = new WiqlQueryBuilder<T>([]);
        callback(groupedBuilder);
        if (groupedBuilder._conditions.length > 0) {
            const condition = `(${groupedBuilder._conditions.join(" ")})`;
            this.appendCondition(condition, conjunction);
        }
        return this;
    }

    constructor(selectFields: T[]) {
        this._selectFields = selectFields;
    }

    static select<T extends keyof WorkItemFields>(...fields: T[]): WiqlQueryBuilder<T> {
        return new WiqlQueryBuilder(fields);
    }

    from(from: From): this {
        this._from = from;
        return this;
    }

    where(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value));
    }

    and(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value), 'AND');
    }

    or(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value), 'OR');
    }

    ever(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value, 'EVER'));
    }

    andEver(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value, 'EVER'), 'AND');
    }

    orEver(field: T, operator: Operator, value: any): this {
        return this.appendCondition(this.createCondition(field, operator, value, 'EVER'), 'OR');
    }

    andGroup(callback: (builder: WiqlQueryBuilder<T>) => void): this {
        return this.group(callback, 'AND');
    }

    orGroup(callback: (builder: WiqlQueryBuilder<T>) => void): this {
        return this.group(callback, 'OR');
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
        
        return `SELECT ${this._selectFields.map(f => `[${String(f)}]`).join(", ")} FROM ${this._from} WHERE (${this._conditions.join(" ")})`;
    }


    async execute(config: AdoConfigData): Promise<Array<Pick<WorkItemFields, T>>> {
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
// .group(builder => {
//  builder
//     .ever("System.AssignedTo", "=", Macro.CurrentUser)   
// })
// .buildQuery() // Optional, but useful for debugging
// .execute(config) // Will build and execute the query
// ;