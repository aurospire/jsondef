import { RootSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating RootSchemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class RootSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'root', Optional>
    implements RootSchema {

    /**
     * Creates a new RootSchemaBuilder instance.
     * @param from - Optional RootSchemaBuilder to copy attributes from.
     */
    constructor(from?: RootSchemaBuilder<Optional>) { super(from); }

    /** Gets the kind of schema, which is always 'root' for RootSchema */
    get kind(): "root" { return 'root'; }

    /**
     * Makes the schema optional.
     * @returns A new RootSchemaBuilder instance with isOptional set to true.
     */
    override optional(): RootSchemaBuilder<true> { return super.optional() as RootSchemaBuilder<true>; }

    /**
     * Makes the schema required.
     * @returns A new RootSchemaBuilder instance with isOptional set to false.
     */
    override required(): RootSchemaBuilder<false> { return super.required() as RootSchemaBuilder<false>; }

    /**
     * Creates a clone of the current builder.
     * @returns A new RootSchemaBuilder instance with the same attributes.
     */
    protected override clone() { return new RootSchemaBuilder<Optional>(this); }
}

