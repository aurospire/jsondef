export * from './Schema';
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
        'Schema',
        'Infer',
        'builder/BaseSchemaBuilder',
        'builder/NullSchemaBuilder',
        'builder/AnySchemaBuilder',
        'builder/BooleanSchemaBuilder',
        'builder/BoundedSchemaBuilder',
        'builder/NumberSchemaBuilder',
        'builder/IntegerSchemaBuilder',
        'builder/PositiveBoundedSchemaBuilder',
        'builder/StringSchemaBuilder',
        'builder/LiteralSchemaBuilder',
        'builder/ArraySchemaBuilder',
        'builder/TupleSchemaBuilder',
        'builder/RecordSchemaBuilder',
        'builder/ObjectSchemaBuilder',
        'builder/ModelSchemaBuilder',
        'builder/CompositeSchemaBuilder',
        'builder/UnionSchemaBuilder',
        'builder/NamespaceSchemaBuilder',
        'builder/RefSchemaBuilder',
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
