import { inspect } from 'util';
import { lexJsonDef } from './parser';
import { JsondefTypes } from './parser/JsondefTypes';

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
        'Infer.ts',
        'Stringify.ts',
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


for (const token of lexJsonDef(`|=()[]{},. ..  ...
    : ?:< <= >>= -12424 1242142 2121e23 123.233 21.31e+12 24.-12 32.1e-12 -
        _aHASs _ _12312 root this model null '' 'Hello' 'H\\x99' '\\r\\n\t\\0\\'\"   \\\\'
`)) {
    const { id, mark: { position: pos, line: ln, column: col }, value } = token;
    const obj = {
        id: id,
        name: JsondefTypes.names(id).join('|'),
        pos,
        ln,
        col,
        value
    };
    console.log(inspect(obj, false, null, true).replaceAll(/^[ ]*/gm, '').replaceAll('\n', ' '));
}