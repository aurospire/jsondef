import { IntegerField, BoundedAttributes } from "../Field";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";

export class IntegerFieldBuilder<Optional extends boolean = false> extends BoundedFieldBuilder<'integer', Optional> implements IntegerField {
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

    clone() { return new IntegerFieldBuilder<Optional>(); }
}
