import { JsonDefType } from "@/parser/JsonDefType";
import { IssueType, parseJsonDef } from "@/parser/parseJsonDef";
import { Schema } from '@/Schema';
import { Token } from "@/util";
import { Result } from "@/util/Result";

const makeTokens = (data: [type: number, value: string][]): Token[] => {
  let position = 0;
  return data.map(([type, value]) => {
    const result = { type, value, length: value.length, mark: { position, line: 0, column: position } };
    position += value.length + 1;
    return result;
  });
};

const parse = (...data: [type: number, value: string][]) => {
  const tokens = makeTokens(data);
  return parseJsonDef(tokens);
};

const value = (result: Result<Schema, Token>): Schema | undefined => {
  return result.success ? result.value : undefined;
};

const message = (result: Result<Schema, Token>): string[] => {
  return result.success ? [] : result.issues.map(issue => issue.message);
};

describe('parseJsonDef', () => {

  describe('NullSchema', () => {
    it('should produce a NullSchema', () => {
      const result = parse([JsonDefType.NullKeyword, 'null']);
      expect(value(result)).toEqual({ kind: 'null' });
    });
  });

  describe('AnySchema', () => {
    it('should produce a AnySchema', () => {
      const result = parse([JsonDefType.NullKeyword, 'any']);
      expect(value(result)).toEqual({ kind: 'any' });
    });
  });

  describe('ThisSchema', () => {
    it('should produce a ThisSchema', () => {
      const result = parse([JsonDefType.NullKeyword, 'this']);
      expect(value(result)).toEqual({ kind: 'this' });
    });
  });

  describe('RootSchema', () => {
    it('should produce a RootSchema', () => {
      const result = parse([JsonDefType.NullKeyword, 'root']);
      expect(value(result)).toEqual({ kind: 'root' });
    });
  });

  describe('BooleanSchema', () => {
    it('should produce a BooleanSchema', () => {
      const result = parse([JsonDefType.NullKeyword, 'boolean']);
      expect(value(result)).toEqual({ kind: 'boolean' });
    });
  });

  describe('LiteralSchema', () => {
    describe('Boolean LiteralSchema', () => {
      it('should produce a True LiteralSchema', () => {
        const result = parse([JsonDefType.TrueKeyword, 'true']);
        expect(value(result)).toEqual({ kind: 'literal', of: true });
      });

      it('should produce a False LiteralSchema', () => {
        const result = parse([JsonDefType.FalseKeyword, 'false']);
        expect(value(result)).toEqual({ kind: 'literal', of: false });
      });
    });

    describe('Numeric LiteralSchema', () => {
      it('should produce a Zero Number LiteralSchema', () => {
        const result = parse([JsonDefType.Number, '0']);
        expect(value(result)).toEqual({ kind: 'literal', of: 0 });
      });
      it('should produce a Number LiteralSchema', () => {
        const result = parse([JsonDefType.Number, '1000']);
        expect(value(result)).toEqual({ kind: 'literal', of: 1000 });
      });

      it('should produce a Integer LiteralSchema', () => {
        const result = parse([JsonDefType.Integer, '-1000']);
        expect(value(result)).toEqual({ kind: 'literal', of: -1000 });
      });

      it('should produce a Decimal Real LiteralSchema', () => {
        const result = parse([JsonDefType.Real, '10.2']);
        expect(value(result)).toEqual({ kind: 'literal', of: 10.2 });
      });

      it('should produce a Exponential Real LiteralSchema', () => {
        const result = parse([JsonDefType.Real, '10.2e-12']);
        expect(value(result)).toEqual({ kind: 'literal', of: 10.2e-12 });
      });
    });

    describe('String LiteralSchema', () => {
      it('should produce an Empty String LiteralSchema', () => {
        const result = parse([JsonDefType.String, "''"]);
        expect(value(result)).toEqual({ kind: 'literal', of: '' });
      });

      it('should produce a String LiteralSchema', () => {
        const result = parse([JsonDefType.String, "'Hello, world!'"]);
        expect(value(result)).toEqual({ kind: 'literal', of: 'Hello, world!' });
      });

      it('should produce a String with Escapes LiteralSchema', () => {
        const result = parse([JsonDefType.String, "'\\\\ \\\' \\\" \\n \\r \\t \\x4f \\0'"]);
        expect(value(result)).toEqual({ kind: 'literal', of: '\\ \' \" \n \r \t \x4f \0' });
      });
    });
  });

  describe('EoF', () => {

    it('should successfully parse with EoF Token', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
        [JsonDefType.Eof, '\0'],
      );

      expect(result.success).toBe(true);
      expect(value(result)).toEqual({ kind: 'null' });
    });

    it('should successfully parse without EoF Token', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
      );

      expect(result.success).toBe(true);
      expect(value(result)).toEqual({ kind: 'null' });
    });

    it('should fail parse without EoF', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
        [JsonDefType.NullKeyword, 'null'],
      );

      expect(result.success).toBe(false);
      expect(message(result)).toEqual(message(IssueType(undefined).EXPECTED_EOF()));
    });
  });
});
