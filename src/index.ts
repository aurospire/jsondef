import { inspect } from 'util';
import { JsonDefTypes } from './parser/JsonDefTypes';
import { tokenizeJsonDef } from "./parser/tokenizeJsonDef";

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


// for (const token of lexJsonDef(`|=()[]{},. ..  ...
//     : ?:< <= >>= -12424 1242142 2121e23 123.233 21.31e+12 24.-12 32.1e-12 -
//         _aHASs _ _12312 root this model null '' 'Hello' 'H\\x99' '\\r\\n\t\\0\\'\"   \\\\'
//     // /Hello/ /[Hell]/ /\\/a/img
// `)) {
//     const { id, mark: { position: pos, line: ln, column: col }, value } = token;
//     const obj = {
//         id: id,
//         name: JsondefTypes.names(id).join('|'),
//         pos,
//         ln,
//         col,
//         value
//     };
//     console.log(inspect(obj, false, null, true).replaceAll(/^[ ]*/gm, '').replaceAll('\n', ' '));
// }

const value = "'unclosed string 'invalid escape \\0'";

let i = 0;
for (const token of tokenizeJsonDef(value)) {
    const { id, mark: { position: pos, line: ln, column: col }, value } = token;
    const obj = {
        id: id,
        name: JsonDefTypes.names(id).join('|'),
        pos,
        ln,
        col,
        value
    };
    console.log(inspect(obj, false, null, true).replaceAll(/^[ ]*/gm, '').replaceAll('\n', ' '));
    if (i++ > 20) break
}