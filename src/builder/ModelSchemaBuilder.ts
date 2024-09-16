import { ModelSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating model schemas.
 * @template Of - The type of the model schema's properties.
 * @template Optional - Whether the schema is optional or not.
 */
export class ModelSchemaBuilder<const Of extends ModelSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'model', Optional>
    implements ModelSchema {

    /** Private field to store the model schema properties */
    #of: Of;

    /**
     * Creates a new ModelSchemaBuilder instance.
     * @param from - Either an existing ModelSchemaBuilder to copy from, or the model schema properties.
     */
    constructor(from: ModelSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ModelSchemaBuilder ? from : undefined);

        this.#of = from instanceof ModelSchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    get kind(): "model" { return 'model'; }

    /** Gets the model schema properties */
    get of(): Of { return this.#of; }

    /**
     * Makes the schema optional.
     * @returns A new ModelSchemaBuilder instance with isOptional set to true.
     */
    override optional(): ModelSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new ModelSchemaBuilder instance with isOptional set to false.
     */
    override required(): ModelSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new ModelSchemaBuilder instance with the same properties.
     */
    protected override clone() { return new ModelSchemaBuilder<Of, Optional>(this); }
}