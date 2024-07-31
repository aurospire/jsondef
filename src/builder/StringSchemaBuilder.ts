import { BoundedAttributes, StringAttributes, StringSchema, StringSchemaFormat } from "../Schema";
import { RegexString } from "../util/RegexString";
import { SizedSchemaBuilder } from "./SizedSchemaBuilder";

export class StringSchemaBuilder<const Optional extends boolean = false>
    extends SizedSchemaBuilder<'string', Optional>
    implements StringSchema {

    #of: StringAttributes['of'];

    constructor(from?: StringSchemaBuilder<Optional>) {
        super(from);

        this.#of = from ? from.#of : undefined;
    }

    override get kind(): "string" { return 'string'; }

    get of() { return this.#of; }


    pattern(pattern?: StringSchema['of']): StringSchemaBuilder<Optional> {
        const builder = this.clone();

        builder.#of = pattern;

        return builder;
    }

    date(): StringSchemaBuilder<Optional> { return this.pattern('date'); }

    time(): StringSchemaBuilder<Optional> { return this.pattern('time'); }

    datetime(): StringSchemaBuilder<Optional> { return this.pattern('datetime'); }

    uuid(): StringSchemaBuilder<Optional> { return this.pattern('uuid'); }

    base64(): StringSchemaBuilder<Optional> { return this.pattern('base64'); }

    email(): StringSchemaBuilder<Optional> { return this.pattern('email'); }

    regex(pattern: RegExp | RegexString): StringSchemaBuilder<Optional> { return this.pattern(pattern); }



    override optional(): StringSchemaBuilder<true> { return super.optional() as any; }

    override required(): StringSchemaBuilder<false> { return super.required() as any; }

    override bound(bounds: BoundedAttributes): StringSchemaBuilder<Optional> { return super.bound(bounds) as any; }

    protected override clone() { return new StringSchemaBuilder<Optional>(this); }
}
