import { BoundedAttributes, IntegerSchema } from "../Schema";
import { BoundedSchemaBuilder } from "./BoundedSchemaBuilder";

/**
 * Builder class for integer schemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class IntegerSchemaBuilder<const Optional extends boolean = false>
    extends BoundedSchemaBuilder<'integer', Optional>
    implements IntegerSchema {

    /**
     * Creates a new IntegerSchemaBuilder instance.
     * @param from - Optional IntegerSchemaBuilder to copy attributes from.
     */
    constructor(from?: IntegerSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema */
    override get kind(): "integer" { return 'integer'; }

    /**
     * Validates the given bounds for an integer schema.
     * @param bounds - The bounded attributes to validate.
     * @throws Error if bounds are invalid.
     */
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

    /**
     * Makes the schema optional.
     * @returns A new builder instance with isOptional set to true.
     */
    override optional(): IntegerSchemaBuilder<true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new builder instance with isOptional set to false.
     */
    override required(): IntegerSchemaBuilder<false> { return super.required() as any; }

    /**
     * Sets the bounds for the integer schema.
     * @param bounds - The bounded attributes to set.
     * @returns A new builder instance with the updated bounds.
     */
    override bound(bounds: BoundedAttributes): IntegerSchemaBuilder<Optional> { return super.bound(bounds) as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes.
     */
    protected override clone() { return new IntegerSchemaBuilder<Optional>(this); }
}