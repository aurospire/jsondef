import { AnySchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating AnySchemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class AnySchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'any', Optional>
    implements AnySchema {

    /**
     * Creates a new AnySchemaBuilder instance.
     * @param from - Optional AnySchemaBuilder to copy attributes from.
     */
    constructor(from?: AnySchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema, which is always 'any' for AnySchema */
    get kind(): "any" { return 'any'; }

    /**
     * Makes the schema optional.
     * @returns A new AnySchemaBuilder instance with isOptional set to true.
     */
    override optional(): AnySchemaBuilder<true> { return super.optional() as AnySchemaBuilder<true>; }

    /**
     * Makes the schema required.
     * @returns A new AnySchemaBuilder instance with isOptional set to false.
     */
    override required(): AnySchemaBuilder<false> { return super.required() as AnySchemaBuilder<false>; }

    /**
     * Creates a clone of the current builder.
     * @returns A new AnySchemaBuilder instance with the same attributes.
     */
    protected override clone() { return new AnySchemaBuilder<Optional>(this); }
}

