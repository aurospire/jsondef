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
import { PrettyStringifyFormat } from './Stringify';

const schema = d.group({
    UserRole: d.enum(['admin', 'user', 'guest']),
    Address: d.model({
        street: d.string(),
        city: d.string(),
        postal: d.regex(/^[A-Z0-9]{5,10}$/),
    }),
    User: d.model({
        id: d.uuid(),
        name: d.string({ max: 100 }),
        age: d.number({ min: 0, max: 120 }),
        role: d.ref('UserRole'),
        email: d.email(),
        address: d.ref('Address'),
        settings: d.object({
            theme: d.enum(['dark', 'light']),
            notifications: d.boolean(),
            tags: d.array(d.string()).bound({ max: 10 })
        }),
        contacts: d.array(d.object({
            type: d.enum(['email', 'phone']),
            value: d.string()
        })),
        preferences: d.record(d.union([d.string(), d.number(), d.boolean()])).bound({ xmax: 10 }),
        references: d.array(d.root())
    })
}).select('User');

console.log(d.stringify(schema, PrettyStringifyFormat({ normalized: true })));
console.log();
console.log(d.stringify(schema, PrettyStringifyFormat({ normalized: false })));

const value = {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "age": 35,
    "role": "admin",
    "email": "john.doe@example.com",
    "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "postal": "A1B2C3"
    },
    "settings": {
        "theme": "dark",
        "notifications": true,
        "tags": ["developer", "admin"]
    },
    "contacts": [
        {
            "type": "email",
            "value": "john.doe@example.com"
        },
        {
            "type": "phone",
            "value": "+1234567890"
        }
    ],
    "preferences": {
        "notifications": true,
        "volume": 5,
        "timezone": "UTC+1"
    },
    "references": [
        {
            "id": "234e5678-e89b-12d3-a456-426614174111",
            "name": "Jane Smith",
            "age": 28,
            "role": "user",
            "email": "jane.smith@example.com",
            "address": {
                "street": "456 Elm St",
                "city": "Othertown",
                "postal": "D4E5F6"
            },
            "settings": {
                "theme": "light",
                "notifications": false,
                "tags": ["user"]
            },
            "contacts": [
                {
                    "type": "email",
                    "value": "jane.smith@example.com"
                }
            ],
            "preferences": {
                "notifications": false,
                "volume": 3,
                "timezone": "UTC-5"
            },
            "references": []
        }
    ]
};


console.log(inspect(d.validate(value, schema), { depth: null, colors: true }));