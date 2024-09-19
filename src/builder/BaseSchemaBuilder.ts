import { BaseAttributes, BaseSchema, NullSchema } from "../Schema";

/**
 * Abstract base class for schema builders.
 * @template Kind - The kind of schema being built.
 * @template Optional - Whether the schema is optional or not. Defaults to false
 */
export abstract class BaseSchemaBuilder<const Kind extends string, const Optional extends boolean = false>
    implements BaseSchema<Kind> {

    #attributes: BaseAttributes;

    /**
     * Creates a new BaseSchemaBuilder instance.
     * @param from - Optional BaseSchemaBuilder to copy attributes from.
     */
    constructor(from?: BaseSchemaBuilder<Kind, Optional>) {
        const attributes = from ? from.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    /** Gets the kind of schema */
    abstract get kind(): Kind;

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes.
     */
    protected abstract clone(): BaseSchemaBuilder<Kind, Optional>;

    /** Gets whether the schema is optional */
    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    /** Gets the description of the schema */
    get description(): NullSchema['description'] { return this.#attributes.description; }

    /**
     * Sets the description of the schema.
     * @param description - The description to set.
     * @returns A new builder instance with the updated description.
     */
    describe(description?: string): BaseSchemaBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#attributes.description = description;

        return builder;
    }

    /**
     * Makes the schema optional.
     * @returns A new builder instance with isOptional set to true.
     */
    optional(): BaseSchemaBuilder<Kind, true> {
        const builder = this.clone();

        builder.#attributes.isOptional = true;

        return builder as BaseSchemaBuilder<Kind, true>;
    }

    /**
     * Makes the schema required.
     * @returns A new builder instance with isOptional set to false.
     */
    required(): BaseSchemaBuilder<Kind, false> {
        const builder = this.clone();

        builder.#attributes.isOptional = false;

        return builder as BaseSchemaBuilder<Kind, false>;
    }
}