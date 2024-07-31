import { SizedAttributes } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export abstract class SizedSchemaBuilder<const Kind extends string, const  Optional extends boolean = false>
    extends BaseSchemaBuilder<Kind, Optional> {

    #bounds: SizedAttributes;

    constructor(from?: SizedSchemaBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
    }

    get exact() { return this.#bounds.exact; }
    get min() { return this.#bounds.min; }
    get xmin() { return this.#bounds.xmin; }
    get max() { return this.#bounds.max; }
    get xmax() { return this.#bounds.xmax; }

    bound(bounds: SizedAttributes): SizedSchemaBuilder<Kind, Optional> {
        this.validateBounds(bounds);

        const builder = this.clone();

        builder.#bounds = { ...bounds };

        return builder;
    }

    protected validateBounds(bounds: SizedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isInteger(value))
                throw new Error(`${name} must be an integer`);

        if (!bounds.exact) {
            let min = (bounds.xmin !== undefined ? bounds.xmin + 1 : undefined) ?? bounds.min ?? 0;

            let max = (bounds.xmax !== undefined ? bounds.xmax - 1 : undefined) ?? bounds.max ?? +Infinity;

            if (min < 0 || max < 0)
                throw new Error('Bounds must be greater or equal to zero.');

            if (min > max)
                throw new Error('Minimum must be less or equal to Maximum');
        }
    }

    protected abstract override clone(): SizedSchemaBuilder<Kind, Optional>;
}

