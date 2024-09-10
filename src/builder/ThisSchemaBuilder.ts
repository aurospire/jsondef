import { ThisSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating ThisSchemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class ThisSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'this', Optional>
    implements ThisSchema {

    /**
     * Creates a new ThisSchemaBuilder instance.
     * @param from - Optional ThisSchemaBuilder to copy attributes from.
     */
    constructor(from?: ThisSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema, which is always 'this' for ThisSchema */
    get kind(): "this" { return 'this'; }

    /**
     * Makes the schema optional.
     * @returns A new ThisSchemaBuilder instance with isOptional set to true.
     */
    override optional(): ThisSchemaBuilder<true> { return super.optional() as ThisSchemaBuilder<true>; }

    /**
     * Makes the schema required.
     * @returns A new ThisSchemaBuilder instance with isOptional set to false.
     */
    override required(): ThisSchemaBuilder<false> { return super.required() as ThisSchemaBuilder<false>; }

    /**
     * Creates a clone of the current builder.
     * @returns A new ThisSchemaBuilder instance with the same attributes.
     */
    protected override clone() { return new ThisSchemaBuilder<Optional>(this); }
}

