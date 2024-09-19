import { ArraySchema, Schema, SizedAttributes } from "../Schema";
import { SizedSchemaBuilder } from "./SizedSchemaBuilder";

/**
 * Builder class for creating array schemas.
 * @template Of - The type of schema for the array elements.
 * @template Optional - Whether the array schema is optional or not.
 */
export class ArraySchemaBuilder<const Of extends Schema, const Optional extends boolean = false>
    extends SizedSchemaBuilder<'array', Optional>
    implements ArraySchema {

    #of: Of;

    /**
     * Creates a new ArraySchemaBuilder instance.
     * @param from - Either an ArraySchemaBuilder to copy from or a Schema for the array elements.
     */
    constructor(from: ArraySchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ArraySchemaBuilder ? from : undefined);

        this.#of = from instanceof ArraySchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    override get kind(): "array" { return 'array'; }

    /** Gets the schema of the array elements */
    get of() { return this.#of; }

    /**
     * Makes the array schema optional.
     * @returns A new ArraySchemaBuilder instance with isOptional set to true.
     */
    override optional(): ArraySchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the array schema required.
     * @returns A new ArraySchemaBuilder instance with isOptional set to false.
     */
    override required(): ArraySchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Sets the size constraints for the array schema.
     * @param size - The size constraints to set.
     * @returns A new ArraySchemaBuilder instance with the updated size constraints.
     */
    override size(size: SizedAttributes): ArraySchemaBuilder<Of, Optional> { return super.size(size) as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of ArraySchemaBuilder with the same attributes and element schema.
     */
    protected override clone() { return new ArraySchemaBuilder<Of, Optional>(this); }
}