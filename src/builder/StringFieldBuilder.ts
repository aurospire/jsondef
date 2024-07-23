import { BoundedAttributes, RegexString, StringAttributes, StringField, StringFieldPattern } from "../Field";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class StringFieldBuilder<const Optional extends boolean = false> extends PositiveBoundedFieldBuilder<'string', Optional> implements StringField {
    #of: StringAttributes['of'];

    constructor(from?: StringFieldBuilder<Optional>) {
        super(from);

        this.#of = from ? from.#of : undefined;
    }

    override get kind(): "string" { return 'string'; }

    get of() { return this.#of; }

    pattern(pattern?: StringFieldPattern | RegExp): StringFieldBuilder<Optional> {
        const builder = this.clone();

        builder.#of = pattern;

        return builder;
    }

    date(): StringFieldBuilder<Optional> { return this.pattern('date'); }

    time(): StringFieldBuilder<Optional> { return this.pattern('time'); }

    datetime(): StringFieldBuilder<Optional> { return this.pattern('datetime'); }

    uuid(): StringFieldBuilder<Optional> { return this.pattern('uuid'); }

    email(): StringFieldBuilder<Optional> { return this.pattern('email'); }

    regex(pattern: RegExp | RegexString): StringFieldBuilder<Optional> { return this.pattern(pattern); }


    
    override optional(): StringFieldBuilder<true> { return super.optional() as any; }
    
    override required(): StringFieldBuilder<false> { return super.required() as any; }
    
    override bound(bounds: BoundedAttributes): StringFieldBuilder<Optional> { return super.bound(bounds) as any; }

    protected override clone() { return new StringFieldBuilder<Optional>(); }
}
