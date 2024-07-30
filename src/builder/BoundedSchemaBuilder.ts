import { BoundedAttributes } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export abstract class BoundedSchemaBuilder<const Kind extends string, const Optional extends boolean = false>
    extends BaseSchemaBuilder<Kind, Optional> {

    #bounds: BoundedAttributes;

    constructor(from?: BoundedSchemaBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
        console.log(this.#bounds, bounds)
    }

    get min() { return this.#bounds.min; }
    get xmin() { return this.#bounds.xmin; }
    get max() { return this.#bounds.max; }
    get xmax() { return this.#bounds.xmax; }

    bound(bounds: BoundedAttributes): BoundedSchemaBuilder<Kind, Optional> {
        this.validateBounds(bounds);

        const builder = this.clone();

        builder.#bounds = { ...bounds };

        return builder;
    }

    protected abstract validateBounds(bounds: BoundedAttributes): void;

    protected abstract override clone(): BoundedSchemaBuilder<Kind, Optional>;
}
