import { BoundedAttributes, NumberSchema } from "../Schema";
import { BoundedSchemaBuilder } from "./BoundedSchemaBuilder";

export class NumberSchemaBuilder<const Optional extends boolean = false>
    extends BoundedSchemaBuilder<'number', Optional>
    implements NumberSchema {

    constructor(from?: NumberSchemaBuilder<Optional>) { super(from); }

    override get kind(): "number" { return 'number'; }

    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isFinite(value))
                throw new Error(`${name} must be an number`);

        let min = bounds.xmin ?? bounds.min ?? -Infinity;

        let max = bounds.xmax ?? bounds.max ?? +Infinity;

        if (min > max)
            throw new Error('Minimum must be less or equal to Maximum');
    }

    override optional(): NumberSchemaBuilder<true> { return super.optional() as any; }

    override required(): NumberSchemaBuilder<false> { return super.required() as any; }

    override bound(bounds: BoundedAttributes): NumberSchemaBuilder<Optional> { return super.bound(bounds) as any; }

    protected override clone() { return new NumberSchemaBuilder<Optional>(this); }
}
