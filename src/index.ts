export * from './Schema';
export * from './Infer';
export * from './builder';
export * as d from './helpers';


const combine_files = async (split: boolean) => {
    const nodefs = await import('fs');
    const nodepath = await import('path');

    const root = nodepath.resolve(__dirname, '..', 'src',);

    const output = nodepath.resolve(__dirname, '..', 'combined');
    let result = '';

    const files = [
        'Schema.ts',
        'validate/Context.ts',
        'validate/SchemaValidator.ts',
        'validate/isObject.ts',
        'validate/Result.ts',
        'validate/validateAny.ts',
        'validate/validateBounds.ts',
        'validate/validateInteger.ts',
        'validate/validateNumber.ts',
        'validate/validateString.ts',
        'validate/validateArray.ts',
        'validate/validateTuple.ts',
        'validate/validateRecord.ts',
        'validate/validateUnion.ts',
        'validate/validateObject.ts',
        'validate/validateGroup.ts',
        'validate/validateRef.ts',
        'validate/validateSchema.ts',
        'validate/validate.ts',
    ];

    const log = (...data: string[]) => {
        result += data.join('') + '\n';
    };
    for (const file of files) {
        const path = nodepath.resolve(root, file.endsWith('.ts') ? file : file + '.ts');

        let code = nodefs.readFileSync(path).toString();

        if (split) {
            log('### @/', file, '.ts ###');
        }
        else {
            code = code.split('\n')
                .filter(line => !line.startsWith('import '))
                .filter(line => line.trim() !== '')
                .join('\n');
        }

        log(code);
        log();
    }

    nodefs.writeFileSync(output, result);
};


import { inspect } from 'util';
import * as d from './helpers';

const schema = d.model({
    a: d.any(),
    b: d.null(),
    c: d.boolean(),
    d0: d.literal(true),
    d1: d.literal(1),
    d2: d.literal('A'),
    d3: d.array(d.enum(['A', 'B', 1, 2, true, false])).size({ exact: 10 }),
    e0: d.string(),
    e1: d.date(),
    e2: d.time(),
    e3: d.datetime(),
    e4: d.uuid(),
    e5: d.email(),
    e6: d.base64(),
    e7: d.regex(/abc/i),
    e8: d.string({ exact: 1, min: 1, max: 10, xmin: 0, xmax: 11 }),
    e9: d.string({ min: 1, max: 10, xmin: 0, xmax: 11 }),
    eA: d.string({ min: 1, max: 10, xmin: 0 }),
    eB: d.string({ min: 1, xmin: 0 }),
    eC: d.string({ min: 1, }),
    eD: d.string({ max: 1, }),
    eE: d.email({ max: 10 }),
    eF: d.regex(/a/, { max: 10 }),
    ff: d.group({
        a: d.array(d.object({}), { max: 10 })
    }).select('a')
});

console.log(d.stringify(schema, { full: true }, true));
console.log();
console.log(d.stringify(schema, { full: false }, true));
