import { NullSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating NullSchemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class NullSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'null', Optional>
    implements NullSchema {

    /**
     * Creates a new NullSchemaBuilder instance.
     * @param from - Optional NullSchemaBuilder to copy attributes from.
     */
    constructor(from?: NullSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema, which is always 'null' for NullSchema */
    get kind(): "null" { return 'null'; }

    /**
     * Makes the schema optional.
     * @returns A new NullSchemaBuilder instance with isOptional set to true.
     */
    override optional(): NullSchemaBuilder<true> { return super.optional() as NullSchemaBuilder<true>; }

    /**
     * Makes the schema required.
     * @returns A new NullSchemaBuilder instance with isOptional set to false.
     */
    override required(): NullSchemaBuilder<false> { return super.required() as NullSchemaBuilder<false>; }

    /**
     * Creates a clone of the current builder.
     * @returns A new NullSchemaBuilder instance with the same attributes.
     */
    protected override clone() { return new NullSchemaBuilder<Optional>(this); }
}

