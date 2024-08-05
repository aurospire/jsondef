import { makeScanner, Token } from "../util";
import { Schema } from '..';

type Issue = { token: Token, message: string; };

type Result = { success: true, schema: Schema; } | { success: false, issues: Issue[]; };

const Result = {
    success: (schema: Schema) => ({ success: true, schema }),
    failure: (issues: Issue[]) => ({ success: false, issues })
};

export const parseJsonDef = (data: Token[]): Result => {
    const scanner = makeScanner(data);

    return { success: false, issues: [] };
};