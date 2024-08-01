import { stringify } from '../src/Stringify';
import { NullSchema, AnySchema, BooleanSchema } from '../src/Schema';

describe('stringify', () => {
    describe('NullSchema', () => {
        const nullSchema: NullSchema = { kind: 'null' };

        it('should stringify a basic null schema (pretty)', () => {
            expect(stringify(nullSchema)).toBe('null');
        });

        it('should stringify a basic null schema (condensed)', () => {
            expect(stringify(nullSchema, {}, true)).toBe('null');
        });
    });

    describe('AnySchema', () => {
        const anySchema: AnySchema = { kind: 'any' };

        it('should stringify a basic any schema (pretty)', () => {
            expect(stringify(anySchema)).toBe('any');
        });

        it('should stringify a basic any schema (condensed)', () => {
            expect(stringify(anySchema, {}, true)).toBe('any');
        });
    });

    describe('BooleanSchema', () => {
        const booleanSchema: BooleanSchema = { kind: 'boolean' };

        it('should stringify a basic boolean schema (pretty)', () => {
            expect(stringify(booleanSchema)).toBe('boolean');
        });

        it('should stringify a basic boolean schema (condensed)', () => {
            expect(stringify(booleanSchema, {}, true)).toBe('boolean');
        });
    });
});