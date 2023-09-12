import { ExtractProject, postWithAuth } from "..";
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
    CurrentIteration = "@CurrentIteration",
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

const prependOperator = (operator: Operator): string => {
    if (operator === "EVER") {
        return "EVER ";
    }
    return "";
}

const operatorValue = (operator: Operator): string => {
    if (operator === "EVER") {
        return "=";
    }
    return operator;
}


export class WiqlQueryBuilder<T extends object, K extends keyof T> {
    private _selectFields: K[];
    private _conditions: string[] = [];
    private _from: string = "";

    constructor(selectFields: K[], from: string) {
        this._selectFields = selectFields;
        this._from = from;
    }

    static createWiql<T extends object>(from: string) {
        return {
            select<K extends keyof T>(...fields: K[]): WiqlQueryBuilder<T, K> {
                return new WiqlQueryBuilder(fields, from);
            }
        };
    }

    where(field: K, operator: Operator, value: string | number | string[] | number[]): this {
        this._conditions.push(`${prependOperator(operator)}[${String(field)}] ${operatorValue(operator)} ${valueToQueryString(value)}`);
        return this;
    }

    and(field: K, operator: Operator, value: string | number | string[] | number[]): this {
        this._conditions.push(`AND ${prependOperator(operator)}[${String(field)}] ${operatorValue(operator)} ${valueToQueryString(value)}`);
        return this;
    }

    or(field: K, operator: Operator, value: string | number | string[] | number[]): this {
        this._conditions.push(`OR ${prependOperator(operator)}[${String(field)}] ${operatorValue(operator)} ${valueToQueryString(value)}`);
        return this;
    }

    group(callback: (builder: WiqlQueryBuilder<T, K>) => void): this {
        const groupedBuilder = new WiqlQueryBuilder<T, K>([], "");
        callback(groupedBuilder);

        if (groupedBuilder._conditions.length === 0) {
            return this;
        }

        if (this._conditions.length > 0) {
            this._conditions.push(`AND (${groupedBuilder._conditions.join(" ")})`);
        } else {
            this._conditions.push(`(${groupedBuilder._conditions.join(" ")})`);
        }

        return this;
    }

    buildQuery(): string {
        return `SELECT ${this._selectFields.map(f => `[${String(f)}]`).join(", ")} FROM ${this._from} WHERE (${this._conditions.join(" ")})`;
    }


    async execute(config: AdoConfigData): Promise<Array<Pick<T, K>>> {
        const project = ExtractProject(config);
        const { organization } = config;

        return postWithAuth(`https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=6.0`,
            {
                query: this.buildQuery()
            });
    }
}

// Example Usage:
// const test = async () => {
//     const adoConfig = await loadConfig();
//     const wiqlBuilder = WiqlQueryBuilder.createWiql<WorkItemFields>("WorkItem");
//     const wiql2 = await wiqlBuilder
//         .select("Title")
//         .where("Title", "=", "Foo")
//         .execute(adoConfig);

//     wiql2.forEach(item => {
//         console.log(item.Title);  // This should be fine.
//         console.log(item.ID);  // This should now throw an error at compile time.
//     });
// }