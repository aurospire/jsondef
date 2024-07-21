import { RegexString, StringAttributes, StringField, StringFieldPattern } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class StringFieldBuilder<Optional extends boolean = false> extends PositiveBoundedFieldBuilder<'string', Optional> implements StringField {
    #of: StringAttributes['of'];

    constructor(from?: StringFieldBuilder<Optional>) {
        super(from);

        this.#of = from ? from.#of : undefined;
    }

    override get kind(): "string" { return 'string'; }

    get of() { return this.#of; }

    ofPattern(pattern?: StringFieldPattern | RegExp): StringFieldBuilder<Optional> {
        const builder = this.clone();

        builder.#of = pattern;

        return builder;
    }

    ofDate(): StringFieldBuilder<Optional> { return this.ofPattern('date'); }

    ofTime(): StringFieldBuilder<Optional> { return this.ofPattern('time'); }

    ofDatetime(): StringFieldBuilder<Optional> { return this.ofPattern('datetime'); }

    ofUuid(): StringFieldBuilder<Optional> { return this.ofPattern('uuid'); }

    ofEmail(): StringFieldBuilder<Optional> { return this.ofPattern('email'); }

    ofRegex(pattern: RegExp | RegexString): StringFieldBuilder<Optional> { return this.ofPattern(pattern); }


    override optional(): StringFieldBuilder<true> { return super.optional() as any; }

    override required(): StringFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new StringFieldBuilder<Optional>(); }
}
