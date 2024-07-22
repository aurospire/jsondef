import { BoundedAttributes } from "../Field";
import { BoundedFieldBuilder } from "./BoundedFieldBuilder";


export abstract class PositiveBoundedFieldBuilder<const Kind extends string, const  Optional extends boolean = false> extends BoundedFieldBuilder<Kind, Optional> {
    constructor(from?: PositiveBoundedFieldBuilder<Kind, Optional>) {
        super(from);
    }

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
}
