import { BoundedAttributes } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export abstract class BoundedFieldBuilder<const Kind extends string, const Optional extends boolean = false> extends BaseFieldBuilder<Kind, Optional> {
    #bounds: BoundedAttributes;

    constructor(from?: BoundedFieldBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
    }

    get min() { return this.#bounds.min; }
    get xmin() { return this.#bounds.xmin; }
    get max() { return this.#bounds.max; }
    get xmax() { return this.#bounds.xmax; }

    bound(bounds: BoundedAttributes): BoundedFieldBuilder<Kind, Optional> {
        this.validateBounds(bounds);

        const builder = this.clone();

        builder.#bounds = { ...bounds };

        return builder;
    }

    protected abstract validateBounds(bounds: BoundedAttributes): void;

    protected abstract override clone(): BoundedFieldBuilder<Kind, Optional>;
}
