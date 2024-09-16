import { ObjectSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating object schemas.
 * @template Of - The type of the object schema's properties.
 * @template Optional - Whether the schema is optional or not.
 */
export class ObjectSchemaBuilder<const Of extends ObjectSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'object', Optional>
    implements ObjectSchema {

    /** Private field to store the object schema properties */
    #of: Of;

    /**
     * Creates a new ObjectSchemaBuilder instance.
     * @param from - Either an existing ObjectSchemaBuilder to copy from, or the object schema properties.
     */
    constructor(from: ObjectSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ObjectSchemaBuilder ? from : undefined);

        this.#of = from instanceof ObjectSchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    get kind(): "object" { return 'object'; }

    /** Gets the object schema properties */
    get of(): Of { return this.#of; }

    /**
     * Makes the schema optional.
     * @returns A new ObjectSchemaBuilder instance with isOptional set to true.
     */
    override optional(): ObjectSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new ObjectSchemaBuilder instance with isOptional set to false.
     */
    override required(): ObjectSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new ObjectSchemaBuilder instance with the same properties.
     */
    protected override clone() { return new ObjectSchemaBuilder<Of, Optional>(this); }
}