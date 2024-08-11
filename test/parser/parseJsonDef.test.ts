import { JsonDefType } from "@/parser/JsonDefType";
import { IssueType, parseJsonDef } from "@/parser/parseJsonDef";
import { Schema } from '@/Schema';
import { Token } from "@/util";
import { Result } from "@/util/Result";

const makeTokens = (...data: [type: number, value: string][]): Token[] => {
  let position = 0;
  return data.map(([type, value]) => {
    const result = { type, value, length: value.length, mark: { position, line: 0, column: position } };
    position += value.length + 1;
    return result;
  });
};

const value = (result: Result<Schema, Token>): Schema | undefined => {
  return result.success ? result.value : undefined;
};

const message = (result: Result<Schema, Token>): string[] => {
  return result.success ? [] : result.issues.map(issue => issue.message);
};

describe('EoF', () => {

  it('checks schema parsing with EoF', () => {
    const tokens = makeTokens(
      [JsonDefType.NullKeyword, 'null'],
      [JsonDefType.Eof, '\0'],
    );

    const result = parseJsonDef(tokens);
    expect(result.success).toBe(true);
    expect(value(result)).toEqual({ kind: 'null' });
  });

  it('checks schema parsing without EoF token', () => {
    const tokens = makeTokens(
      [JsonDefType.NullKeyword, 'null'],
    );

    const result = parseJsonDef(tokens);
    expect(result.success).toBe(true);
    expect(value(result)).toEqual({ kind: 'null' });
  });

  it('checks schema parsing without EoF', () => {
    const tokens = makeTokens(
      [JsonDefType.NullKeyword, 'null'],
      [JsonDefType.NullKeyword, 'null'],
    );

    const result = parseJsonDef(tokens);
    expect(result.success).toBe(false);
    expect(message(result)).toEqual(message(IssueType(undefined).EXPECTED_EOF()));
  });
});