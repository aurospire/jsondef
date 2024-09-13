import { SizedAttributes } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Abstract base class for schema builders that include size constraints.
 * @template Kind - The kind of schema being built.
 * @template Optional - Whether the schema is optional or not.
 */
export abstract class SizedSchemaBuilder<const Kind extends string, const Optional extends boolean = false>
    extends BaseSchemaBuilder<Kind, Optional> {

    #bounds: SizedAttributes;

    /**
     * Creates a new SizedSchemaBuilder instance.
     * @param from - Optional SizedSchemaBuilder to copy attributes from.
     */
    constructor(from?: SizedSchemaBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
    }

    /** Gets the exact size constraint */
    get exact() { return this.#bounds.exact; }

    /** Gets the inclusive minimum size constraint */
    get min() { return this.#bounds.min; }
    
    /** Gets the exclusive minimum size constraint */
    get xmin() { return this.#bounds.xmin; }
    
    /** Gets the inclusive maximum size constraint */
    get max() { return this.#bounds.max; }
    
    /** Gets the exclusive maximum size constraint */
    get xmax() { return this.#bounds.xmax; }

    /**
     * Sets the size constraints for the schema.
     * @param size - The size constraints to set.
     * @returns A new builder instance with the updated size constraints.
     */
    size(size: SizedAttributes): SizedSchemaBuilder<Kind, Optional> {
        this.validateBounds(size);

        const builder = this.clone();

        builder.#bounds = { ...size };

        return builder;
    }

    /**
     * Validates the provided size bounds.
     * @param bounds - The size bounds to validate.
     * @throws Error if the bounds are invalid.
     */
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

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes and bounds.
     */
    protected abstract override clone(): SizedSchemaBuilder<Kind, Optional>;
}