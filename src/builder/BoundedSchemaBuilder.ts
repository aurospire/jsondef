import { BoundedAttributes } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Abstract class for building schemas with bounded attributes.
 * @template Kind - The kind of schema being built.
 * @template Optional - Whether the schema is optional or not.
 */
export abstract class BoundedSchemaBuilder<const Kind extends string, const Optional extends boolean = false>
    extends BaseSchemaBuilder<Kind, Optional> {

    #bounds: BoundedAttributes;

    /**
     * Creates a new BoundedSchemaBuilder instance.
     * @param from - Optional BoundedSchemaBuilder to copy attributes from.
     */
    constructor(from?: BoundedSchemaBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
    }

    /** Gets the inclusive minimum value */
    get min() { return this.#bounds.min; }

    /** Gets the exclusive minimum value */
    get xmin() { return this.#bounds.xmin; }

    /** Gets the inclusive maximum value */
    get max() { return this.#bounds.max; }

    /** Gets the exclusive maximum value */
    get xmax() { return this.#bounds.xmax; }

    /**
     * Sets the bounds for the schema.
     * @param bounds - The bounded attributes to set.
     * @returns A new builder instance with the updated bounds.
     */
    bound(bounds: BoundedAttributes): BoundedSchemaBuilder<Kind, Optional> {
        this.validateBounds(bounds);

        const builder = this.clone();

        builder.#bounds = { ...bounds };

        return builder;
    }

    /**
     * Validates the given bounds.
     * @param bounds - The bounded attributes to validate.
     */
    protected abstract validateBounds(bounds: BoundedAttributes): void;

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes.
     */
    protected abstract override clone(): BoundedSchemaBuilder<Kind, Optional>;
}