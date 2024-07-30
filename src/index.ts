export * from './Schema';
export * from './Infer';
export * from './builder';
export * as j from './helpers';


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


import * as j from './helpers';
import { PrettyStringifyFormat } from './Stringify';

const schema = j.tuple([j.boolean(), j.integer()], j.array(j.null()).length(10))
console.log(j.stringify(schema, PrettyStringifyFormat({condensed:true})));