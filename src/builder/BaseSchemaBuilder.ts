import { BaseSchema, BaseAttributes, NullSchema } from "../Schema";

export abstract class BaseSchemaBuilder<const Kind extends string, const Optional extends boolean = false>
    implements BaseSchema<Kind> {

    #attributes: BaseAttributes;

    constructor(from?: BaseSchemaBuilder<Kind, Optional>) {
        const attributes = from ? from.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    abstract get kind(): Kind;

    protected abstract clone(): BaseSchemaBuilder<Kind, Optional>;


    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    get description(): NullSchema['description'] { return this.#attributes.description; }

    describe(description?: string): BaseSchemaBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#attributes.description = description;

        return builder;
    }

    optional(): BaseSchemaBuilder<Kind, true> {
        const builder = this.clone();

        builder.#attributes.isOptional = true;

        return builder as BaseSchemaBuilder<Kind, true>;

    };
    required(): BaseSchemaBuilder<Kind, false> {
        const builder = this.clone();

        builder.#attributes.isOptional = false;

        return builder as BaseSchemaBuilder<Kind, false>;
    }
}
