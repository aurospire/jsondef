import { inspect } from 'util';
import { JsonDefTypes } from './parser/JsonDefTypes';
import { parseJsonDef } from './parser/parseJsonDef';
import { tokenizeJsonDef } from './parser/tokenizeJsonDef';
import { stringify } from './stringify';

export * from './builder';
export * as d from './helpers';
export * from './Infer';
export * from './Schema';

const combine_files = async (split: boolean) => {
    const nodefs = await import('fs');
    const nodepath = await import('path');

    const root = nodepath.resolve(__dirname, '..', 'src',);

    const output = nodepath.resolve(__dirname, '..', 'combined');
    let result = '';

    const files = [
        'util/parser/CharSet.ts',
        'util/parser/Scanner.ts',
        'parser/JsonDefTypes.ts',
        'parser/lexJsonDef.ts'
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


const data = `
| null 
| any 
| boolean
| root 
| this 
| false 
| true 
| -12 
| 10[> 2]
| 1.234 
| -123e+12 
| -123e-12 
| 'Hello' 
| 'Hello\\n'
| Identifier
| ( 1 | 2 | 3 )[>= 100, <= 10]
| number(<1.02)
| number
| integer()
| integer(>= -10, < 22)
`;

const tokens = [...tokenizeJsonDef(data)];

console.log(tokens.map(({ id, value }) => ({ name: JsonDefTypes.names(id), value })));

const result = parseJsonDef(tokens);

console.log(inspect(result, { depth: null, colors: true }));

if (result.success) {
    console.log(stringify(result.value))
}