import { BoundedAttributes, IntegerField } from "../Field";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";

export class IntegerFieldBuilder<const Optional extends boolean = false> extends BoundedFieldBuilder<'integer', Optional> implements IntegerField {
    constructor(from?: IntegerFieldBuilder<Optional>) { super(from); }

    override get kind(): "integer" { return 'integer'; }

    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isInteger(value))
                throw new Error(`${name} must be an integer`);

        let min = bounds.xmin ?? bounds.min ?? -Infinity;

        let max = bounds.xmax ?? bounds.max ?? +Infinity;

        if (min <= max)
            throw new Error('Minimum must be less or equal to Maximum');
    }

    override optional(): IntegerFieldBuilder<true> { return super.optional() as any; }

    override required(): IntegerFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new IntegerFieldBuilder<Optional>(); }
}
