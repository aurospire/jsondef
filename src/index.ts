export * as d from './helpers';

const combine_files = async (split: boolean, ...files: string[]) => {
    const nodefs = await import('fs');
    const nodepath = await import('path');

    const root = nodepath.resolve(__dirname, '..', 'src',);

    const output = nodepath.resolve(__dirname, '..', 'combined');

    let result = '';

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
