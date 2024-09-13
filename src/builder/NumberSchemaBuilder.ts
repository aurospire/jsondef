import { BoundedAttributes, NumberSchema } from "../Schema";
import { BoundedSchemaBuilder } from "./BoundedSchemaBuilder";

/**
 * Builder class for number schemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class NumberSchemaBuilder<const Optional extends boolean = false>
    extends BoundedSchemaBuilder<'number', Optional>
    implements NumberSchema {

    /**
     * Creates a new NumberSchemaBuilder instance.
     * @param from - Optional NumberSchemaBuilder to copy attributes from.
     */
    constructor(from?: NumberSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema */
    override get kind(): "number" { return 'number'; }

    /**
     * Validates the given bounds for an number schema.
     * @param bounds - The bounded attributes to validate.
     * @throws Error if bounds are invalid.
     */
    protected override validateBounds(bounds: BoundedAttributes): void {
        for (const [name, value] of Object.entries(bounds))
            if (value !== undefined && !Number.isFinite(value))
                throw new Error(`${name} must be an number`);

        let min = bounds.xmin ?? bounds.min ?? -Infinity;

        let max = bounds.xmax ?? bounds.max ?? +Infinity;

        if (min > max)
            throw new Error('Minimum must be less or equal to Maximum');
    }


    /**
     * Makes the schema optional.
     * @returns A new builder instance with isOptional set to true.
     */
    override optional(): NumberSchemaBuilder<true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new builder instance with isOptional set to false.
     */
    override required(): NumberSchemaBuilder<false> { return super.required() as any; }

    /**
     * Sets the bounds for the number schema.
     * @param bounds - The bounded attributes to set.
     * @returns A new builder instance with the updated bounds.
     */
    override bound(bounds: BoundedAttributes): NumberSchemaBuilder<Optional> { return super.bound(bounds) as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes.
     */
    protected override clone() { return new NumberSchemaBuilder<Optional>(this); }
}