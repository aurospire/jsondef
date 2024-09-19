import { BooleanSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating BooleanSchemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class BooleanSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'boolean', Optional>
    implements BooleanSchema {

    /**
     * Creates a new BooleanSchemaBuilder instance.
     * @param from - Optional BooleanSchemaBuilder to copy attributes from.
     */
    constructor(from?: BooleanSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema */
    get kind(): "boolean" { return 'boolean'; }

    /**
     * Makes the schema optional.
     * @returns A new BooleanSchemaBuilder instance with isOptional set to true.
     */
    override optional(): BooleanSchemaBuilder<true> { return super.optional() as BooleanSchemaBuilder<true>; }

    /**
     * Makes the schema required.
     * @returns A new BooleanSchemaBuilder instance with isOptional set to false.
     */
    override required(): BooleanSchemaBuilder<false> { return super.required() as BooleanSchemaBuilder<false>; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the BooleanSchemaBuilder with the same attributes.
     */
    protected override clone() { return new BooleanSchemaBuilder(this); }
}