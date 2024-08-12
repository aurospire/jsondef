import { JsonDefType } from "@/parser/JsonDefType";
import { IssueType, parseJsonDef } from "@/parser/parseJsonDef";
import { tokenizeJsonDef } from "@/parser/tokenizeJsonDef";
import { Schema } from '@/Schema';
import { Token } from "@/util";
import { Result } from "@/util/Result";
import { inspect } from "util";

const parse = (...data: (string | [type: number, value: string])[]) => {
  let position = 0;

  const tokens: Token[] = data.flatMap(item => {
    if (typeof item === 'string') {
      const result = tokenizeJsonDef(item);
      position += item.length;
      return [...result];
    }
    else {
      const [type, value] = item;
      const result = { type, value, length: value.length, mark: { position, line: 0, column: position } };
      position += value.length + 1;
      return result;
    }
  });

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

  describe('RefSchema', () => {
    it('should produce a RefSchema', () => {
      const result = parse([JsonDefType.Identifier, 'Hello']);
      expect(value(result)).toEqual({ kind: 'ref', of: 'Hello' });
    });
  });

  describe('IntegerSchema', () => {
    it('should produce an IntegerSchema', () => {
      const result = parse([JsonDefType.IntegerKeyword, 'integer']);
      expect(value(result)).toEqual({ kind: 'integer' });
    });

    it('should produce an IntegerSchema with bounds', () => {
      expect(value(parse('integer', '(', ')'))).toEqual({ kind: 'integer' });

      expect(value(parse('integer(>=', [JsonDefType.Number, '10'], ')'))).toEqual({ kind: 'integer', min: 10 });
      expect(value(parse('integer(>=', [JsonDefType.Integer, '-10'], ')'))).toEqual({ kind: 'integer', min: -10 });

      expect(value(parse('integer(>= 10)'))).toEqual({ kind: 'integer', min: 10 });
      expect(value(parse('integer(<= 10)'))).toEqual({ kind: 'integer', max: 10 });
      expect(value(parse('integer(>  10)'))).toEqual({ kind: 'integer', xmin: 10 });
      expect(value(parse('integer(<  10)'))).toEqual({ kind: 'integer', xmax: 10 });

      expect(value(parse('integer(>= -10, <= 20)'))).toEqual({ kind: 'integer', min: -10, max: 20 });
      expect(value(parse('integer(>= -10, <  20)'))).toEqual({ kind: 'integer', min: -10, xmax: 20 });
      expect(value(parse('integer(>  -10, <= 20)'))).toEqual({ kind: 'integer', xmin: -10, max: 20 });
      expect(value(parse('integer(>  -10, <  20)'))).toEqual({ kind: 'integer', xmin: -10, xmax: 20 });
    });

    it('should match issues', () => {
      expect(message(parse('integer('))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));

      expect(message(parse('integer(>)'))).toEqual(message(IssueType(undefined).EXPECTED('Number', 'Integer')));

      expect(message(parse('integer(> 0.1)'))).toEqual(message(IssueType(undefined).EXPECTED('Number', 'Integer')));

      expect(message(parse('integer(#)'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));
    });
  });

  describe('NumberSchema', () => {
    it('should produce a nNumberSchema', () => {
      const result = parse([JsonDefType.NumberKeyword, 'number']);
      expect(value(result)).toEqual({ kind: 'number' });
    });

    it('should produce a NumberSchema with bounds', () => {
      expect(value(parse('number', '(', ')'))).toEqual({ kind: 'number' });

      expect(value(parse('number(>=', [JsonDefType.Number, '10'], ')'))).toEqual({ kind: 'number', min: 10 });
      expect(value(parse('number(>=', [JsonDefType.Integer, '-10'], ')'))).toEqual({ kind: 'number', min: -10 });
      expect(value(parse('number(>=', [JsonDefType.Real, '10.12'], ')'))).toEqual({ kind: 'number', min: 10.12 });

      expect(value(parse('number(>= 10)'))).toEqual({ kind: 'number', min: 10 });
      expect(value(parse('number(<= 10)'))).toEqual({ kind: 'number', max: 10 });
      expect(value(parse('number(>  10)'))).toEqual({ kind: 'number', xmin: 10 });
      expect(value(parse('number(<  10)'))).toEqual({ kind: 'number', xmax: 10 });

      expect(value(parse('number(>= -10.34e-3, <= 20.2e12)'))).toEqual({ kind: 'number', min: -10.34e-3, max: 20.2e12 });
      expect(value(parse('number(>= -10.34e-3, <  20.2e12)'))).toEqual({ kind: 'number', min: -10.34e-3, xmax: 20.2e12 });
      expect(value(parse('number(>  -10.34e-3, <= 20.2e12)'))).toEqual({ kind: 'number', xmin: -10.34e-3, max: 20.2e12 });
      expect(value(parse('number(>  -10.34e-3, <  20.2e12)'))).toEqual({ kind: 'number', xmin: -10.34e-3, xmax: 20.2e12 });
    });

    it('should match issues', () => {
      expect(message(parse('number('))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));

      expect(message(parse('number(>)'))).toEqual(message(IssueType(undefined).EXPECTED('Number', 'Integer', 'Real')));

      expect(message(parse('number(#)'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));
    });
  });

  describe('StringSchema', () => {
    it('should produce an StringSchema', () => {
      expect(value(parse('string'))).toEqual({ kind: 'string' });
    });

    it('should produce an Formatted StringSchema', () => {
      expect(value(parse('date'))).toEqual({ kind: 'string', of: 'date' });
      expect(value(parse('time'))).toEqual({ kind: 'string', of: 'time' });
      expect(value(parse('datetime'))).toEqual({ kind: 'string', of: 'datetime' });
      expect(value(parse('uuid'))).toEqual({ kind: 'string', of: 'uuid' });
      expect(value(parse('base64'))).toEqual({ kind: 'string', of: 'base64' });
      expect(value(parse('email'))).toEqual({ kind: 'string', of: 'email' });
      expect(value(parse('/ABC/'))).toEqual({ kind: 'string', of: '/ABC/' });
      expect(value(parse('/ABC/ig'))).toEqual({ kind: 'string', of: '/ABC/ig' });
    });

    it('should produce an StringSchema with bounds', () => {
      expect(value(parse('string', '(', ')'))).toEqual({ kind: 'string' });

      expect(value(parse('string(>=', [JsonDefType.Number, '10'], ')'))).toEqual({ kind: 'string', min: 10 });
      expect(value(parse('date(>=', [JsonDefType.Number, '10'], ')'))).toEqual({ kind: 'string', of: 'date', min: 10 });

      expect(value(parse('string(= 10)'))).toEqual({ kind: 'string', exact: 10 });

      expect(value(parse('string(>= 10)'))).toEqual({ kind: 'string', min: 10 });
      expect(value(parse('string(<= 10)'))).toEqual({ kind: 'string', max: 10 });
      expect(value(parse('string(>  10)'))).toEqual({ kind: 'string', xmin: 10 });
      expect(value(parse('string(<  10)'))).toEqual({ kind: 'string', xmax: 10 });

      expect(value(parse('string(>= 10, <= 20)'))).toEqual({ kind: 'string', min: 10, max: 20 });
      expect(value(parse('string(>= 10, <  20)'))).toEqual({ kind: 'string', min: 10, xmax: 20 });
      expect(value(parse('string(>  10, <= 20)'))).toEqual({ kind: 'string', xmin: 10, max: 20 });
      expect(value(parse('string(>  10, <  20)'))).toEqual({ kind: 'string', xmin: 10, xmax: 20 });
    });

    it('should match issues', () => {
      expect(message(parse('string('))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));

      expect(message(parse('string(>)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('string(> -10)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('string(> 0.1)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('string(#)'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));
    });
  });

  describe('ArraySchema', () => {
    it('should parse an ArraySchema of any', () => {
      expect(value(parse('any[]'))).toEqual({ kind: 'array', of: { kind: 'any' } });
    });

    it('should parse an ArraySchema of ArraySchema of any', () => {
      expect(value(parse('any[][]'))).toEqual({ kind: 'array', of: { kind: 'array', of: { kind: 'any' } } });
    });

    it('should parse an ArraySchema of ArraySchema of ArraySchema of any', () => {
      expect(value(parse('any[][][]'))).toEqual({ kind: 'array', of: { kind: 'array', of: { kind: 'array', of: { kind: 'any' } } } });
    });

    it('should produce an ArraySchema with bounds', () => {
      expect(value(parse('any[>=', [JsonDefType.Number, '10'], ']'))).toEqual({ kind: 'array', of: { kind: 'any' }, min: 10 });

      expect(value(parse('any[= 10]'))).toEqual({ kind: 'array', of: { kind: 'any' }, exact: 10 });

      expect(value(parse('any[>= 10]'))).toEqual({ kind: 'array', of: { kind: 'any' }, min: 10 });
      expect(value(parse('any[<= 10]'))).toEqual({ kind: 'array', of: { kind: 'any' }, max: 10 });
      expect(value(parse('any[>  10]'))).toEqual({ kind: 'array', of: { kind: 'any' }, xmin: 10 });
      expect(value(parse('any[<  10]'))).toEqual({ kind: 'array', of: { kind: 'any' }, xmax: 10 });

      expect(value(parse('any[>= 10, <= 20]'))).toEqual({ kind: 'array', of: { kind: 'any' }, min: 10, max: 20 });
      expect(value(parse('any[>= 10, <  20]'))).toEqual({ kind: 'array', of: { kind: 'any' }, min: 10, xmax: 20 });
      expect(value(parse('any[>  10, <= 20]'))).toEqual({ kind: 'array', of: { kind: 'any' }, xmin: 10, max: 20 });
      expect(value(parse('any[>  10, <  20]'))).toEqual({ kind: 'array', of: { kind: 'any' }, xmin: 10, xmax: 20 });
    });

    it('should produce an ArraySchema of ArraySchema with bounds', () => {
      expect(value(parse('any[>=10][=3]'))).toEqual({ kind: 'array', of: { kind: 'array', of: { kind: 'any' }, min: 10 }, exact: 3 });
    });

    it('should produce an ArraySchema of bounded Schemas', () => {
      expect(value(parse('integer(>3, <=7)[>= 4]'))).toEqual({ kind: 'array', of: { kind: 'integer', xmin: 3, max: 7 }, min: 4 });
    });

    it('should match issues', () => {
      expect(message(parse('any['))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(']')));

      expect(message(parse('any[>)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('any[> -10]'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('any[> 0.1]'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('any[#]'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(']')));
    });
  });

  describe('TupleSchema', () => {
    it('should parse an Empty TupleSchema', () => {
      expect(value(parse('[]'))).toEqual({ kind: 'tuple', of: [] });
    });

    it('should parse a 1-TupleSchema', () => {
      expect(value(parse('[any]'))).toEqual({ kind: 'tuple', of: [{ kind: 'any' }] });
    });

    it('should parse a 2-TupleSchema', () => {
      expect(value(parse('[any, integer(>10)]'))).toEqual({ kind: 'tuple', of: [{ kind: 'any' }, { kind: 'integer', xmin: 10 }] });
    });

    it('should parse a Rest 0-TupleSchema', () => {
      expect(value(parse('[...any[]]'))).toEqual({ kind: 'array', of: { kind: 'any' } });
    });

    it('should parse a Rest 1-TupleSchema', () => {
      expect(value(parse('[null, ...any[]]'))).toEqual({ kind: 'tuple', of: [{ kind: 'null' }], rest: { kind: 'array', of: { kind: 'any' } } });
    });

    it('should parse a Rest 2-TupleSchema', () => {
      expect(value(parse('[null, boolean, ...any[]]'))).toEqual({ kind: 'tuple', of: [{ kind: 'null' }, { kind: 'boolean' }], rest: { kind: 'array', of: { kind: 'any' } } });
    });

    it('should parse a Bounded-Rest 1-TupleSchema', () => {
      expect(value(parse('[null, ...any[=4]]'))).toEqual({ kind: 'tuple', of: [{ kind: 'null' }], rest: { kind: 'array', of: { kind: 'any' }, exact: 4 } });
    });

    it('should fail to parse', () => {
      expect(message(parse('[null'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(',')));

      expect(message(parse('[null,'))).toEqual(message(IssueType(undefined).EXPECTED('Schema')));

      expect(message(parse('[...null[],'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(']')));

      expect(message(parse('[...null,'))).toEqual(message(IssueType(undefined).MUST_BE('Rest Schema', 'an Array Schema')));

      expect(message(parse('[...]'))).toEqual(message(IssueType(undefined).EXPECTED('Rest Schema')));
    });
  });

  describe('RecordSchema', () => {
    it('Should parse a default-keyed RecordSchema of any', () => {
      expect(value(parse('record<any>'))).toEqual({ kind: 'record', of: { kind: 'any' } });
    });

    it('should produce a default-keyed RecordSchema with bounds', () => {
      expect(value(parse('record<any>', '(', ')'))).toEqual({ kind: 'record', of: { kind: 'any' } });

      expect(value(parse('record<any>(>=', [JsonDefType.Number, '10'], ')'))).toEqual({ kind: 'record', of: { kind: 'any' }, min: 10 });

      expect(value(parse('record<any>(= 10)'))).toEqual({ kind: 'record', of: { kind: 'any' }, exact: 10 });

      expect(value(parse('record<any>(>= 10)'))).toEqual({ kind: 'record', of: { kind: 'any' }, min: 10 });
      expect(value(parse('record<any>(<= 10)'))).toEqual({ kind: 'record', of: { kind: 'any' }, max: 10 });
      expect(value(parse('record<any>(>  10)'))).toEqual({ kind: 'record', of: { kind: 'any' }, xmin: 10 });
      expect(value(parse('record<any>(<  10)'))).toEqual({ kind: 'record', of: { kind: 'any' }, xmax: 10 });

      expect(value(parse('record<any>(>= 10, <= 20)'))).toEqual({ kind: 'record', of: { kind: 'any' }, min: 10, max: 20 });
      expect(value(parse('record<any>(>= 10, <  20)'))).toEqual({ kind: 'record', of: { kind: 'any' }, min: 10, xmax: 20 });
      expect(value(parse('record<any>(>  10, <= 20)'))).toEqual({ kind: 'record', of: { kind: 'any' }, xmin: 10, max: 20 });
      expect(value(parse('record<any>(>  10, <  20)'))).toEqual({ kind: 'record', of: { kind: 'any' }, xmin: 10, xmax: 20 });
    });

    it('Should parse a custom-keyed RecordSchema of any', () => {
      expect(value(parse('record<string, any>'))).toEqual({ kind: 'record', key: { kind: 'string' }, of: { kind: 'any' } });
      expect(value(parse('record<string(=10), any>'))).toEqual({ kind: 'record', key: { kind: 'string', exact: 10 }, of: { kind: 'any' } });
      expect(value(parse('record<date, any>'))).toEqual({ kind: 'record', key: { kind: 'string', of: 'date' }, of: { kind: 'any' } });
      expect(value(parse('record</ABC/i, any>'))).toEqual({ kind: 'record', key: { kind: 'string', of: '/ABC/i' }, of: { kind: 'any' } });
    });

    it('Should parse a nested RecordSchema', () => {
      expect(value(parse('record<uuid, record</ABC/i,any>>'))).toEqual({
        kind: 'record', key: { kind: 'string', of: 'uuid' }, of: {
          kind: 'record', key: { kind: 'string', of: '/ABC/i' }, of: { kind: 'any' }
        }
      });
    });

    it('should match issues', () => {
      expect(message(parse('record'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL('<')));

      expect(message(parse('record<any'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL('>')));
      
      expect(message(parse('record<string,'))).toEqual(message(IssueType(undefined).EXPECTED('Schema')));
      
      expect(message(parse('record<string,any'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL('>')));

      expect(message(parse('record<any,any>'))).toEqual(message(IssueType(undefined).MUST_BE('Record Key', 'String Schema')));

      expect(message(parse('record<any>('))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));

      expect(message(parse('record<any>(>)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('record<any>(> -10)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('record<any>(> 0.1)'))).toEqual(message(IssueType(undefined).EXPECTED('Number')));

      expect(message(parse('record<any>(#)'))).toEqual(message(IssueType(undefined).EXPECTED_SYMBOL(')')));
    });
  });

  describe('EoF', () => {
    it('should successfully parse with EoF Token', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
        [JsonDefType.Eof, '\0'],
      );

      expect(value(result)).toEqual({ kind: 'null' });
    });

    it('should successfully parse without EoF Token', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
      );

      expect(value(result)).toEqual({ kind: 'null' });
    });

    it('should fail parse without EoF Token', () => {
      const result = parse(
        [JsonDefType.NullKeyword, 'null'],
        [JsonDefType.NullKeyword, 'null'],
      );

      expect(message(result)).toEqual(message(IssueType(undefined).EXPECTED_EOF()));
    });

    it('should fail parse with Empty or Just Eof', () => {
      expect(message(parse())).toEqual(message(IssueType(undefined).EXPECTED('Schema')));
      expect(message(parse('\0'))).toEqual(message(IssueType(undefined).EXPECTED('Schema')));
    });
  });
});
