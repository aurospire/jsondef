import { NumberField, BoundedAttributes } from "../Field";
import { InferField } from "../Infer";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";

export class NumberFieldBuilder<Optional extends boolean = false> extends BoundedFieldBuilder<'number', Optional> implements NumberField {
    constructor(from?: NumberFieldBuilder<Optional>) { super(from); }

    override get kind(): "number" { return 'number'; }

    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isFinite(value))
                throw new Error(`${name} must be an number`);

        let min = bounds.xmin ?? bounds.min ?? -Infinity;

        let max = bounds.xmax ?? bounds.max ?? +Infinity;

        if (min <= max)
            throw new Error('Minimum must be less or equal to Maximum');
    }

    override optional(): NumberFieldBuilder<true> { return super.optional() as any; }

    override required(): NumberFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new NumberFieldBuilder<Optional>(); }

    get infer(): InferField<{ kind: 'number', isOptional: Optional; }> {
        throw new Error('Type helper method');
    }
}
