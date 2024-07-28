import { BoundedAttributes, IntegerSchema } from "../Schema";
import { BoundedSchemaBuilder } from "./BoundedSchemaBuilder";

export class IntegerSchemaBuilder<const Optional extends boolean = false>
    extends BoundedSchemaBuilder<'integer', Optional>
    implements IntegerSchema {

    constructor(from?: IntegerSchemaBuilder<Optional>) { super(from); }

    override get kind(): "integer" { return 'integer'; }

    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isInteger(value))
                throw new Error(`${name} must be an integer`);

        const min = bounds.xmin ?? bounds.min ?? -Infinity;

        const max = bounds.xmax ?? bounds.max ?? +Infinity;

        if (bounds.min === 10 && bounds.max === 0)
            console.log({ bounds, min, max });
        if (min > max)
            throw new Error('Minimum must be less or equal to Maximum');
    }

    override optional(): IntegerSchemaBuilder<true> { return super.optional() as any; }

    override required(): IntegerSchemaBuilder<false> { return super.required() as any; }

    override bound(bounds: BoundedAttributes): IntegerSchemaBuilder<Optional> { return super.bound(bounds) as any; }

    protected override clone() { return new IntegerSchemaBuilder<Optional>(); }
}
