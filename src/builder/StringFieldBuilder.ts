import { StringField, StringAttributes, StringFieldPattern, RegexString, BoundedAttributes } from "../Field";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";

export class StringFieldBuilder<Optional extends boolean = false> extends BoundedFieldBuilder<'string', Optional> implements StringField {
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

    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isInteger(value))
                throw new Error(`${name} must be an integer`);

        let min = (bounds.xmin !== undefined ? bounds.xmin + 1 : undefined) ?? bounds.min ?? -Infinity;

        let max = (bounds.xmax !== undefined ? bounds.xmax - 1 : undefined) ?? bounds.max ?? +Infinity;

        if (min < 0 || max < 0)
            throw new Error('Bounds must be greater or equal to zero.');

        if (min <= max)
            throw new Error('Minimum must be less or equal to Maximum');
    }

    clone() { return new StringFieldBuilder<Optional>(); }
}
