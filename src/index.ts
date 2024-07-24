export * from './Field';
export * from './Infer';
export * from './builder';
export * as j from './helpers';


const combine_files = async () => {
    const nodefs = await import('fs');
    const nodepath = await import('path');

    const root = nodepath.resolve(__dirname, '..', 'src',);

    const output = nodepath.resolve(__dirname, '..', 'combined');
    let result = '';

    const files = [
        'util/UnionToIntersection',
        'Field',
        'Infer',
        'builder/BaseFieldBuilder',
        'builder/NullFieldBuilder',
        'builder/AnyFieldBuilder',
        'builder/BooleanFieldBuilder',
        'builder/BoundedFieldBuilder',
        'builder/NumberFieldBuilder',
        'builder/IntegerFieldBuilder',
        'builder/PositiveBoundedFieldBuilder',
        'builder/StringFieldBuilder',
        'builder/LiteralFieldBuilder',
        'builder/ArrayFieldBuilder',
        'builder/TupleFieldBuilder',
        'builder/RecordFieldBuilder',
        'builder/ObjectFieldBuilder',
        'builder/ModelFieldBuilder',
        'builder/CompositeFieldBuilder',
        'builder/UnionFieldBuilder',
        'builder/NamespaceFieldBuilder',
        'builder/RefFieldBuilder',
        'builder/helpers'
    ];

    const log = (...data: string[]) => {
        result += data.join('') + '\n';
    };
    for (const file of files) {
        const path = nodepath.resolve(root, file + '.ts');

        const code = nodefs.readFileSync(path).toString();

        log('### @/', file, '.ts ###');

        log(code);
        log();
    }

    nodefs.writeFileSync(output, result);
};
