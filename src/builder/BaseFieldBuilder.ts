import { BaseField, BaseAttributes, NullField } from "../Field";

export abstract class BaseFieldBuilder<const Kind extends string, const Optional extends boolean = false> implements BaseField<Kind> {
    #attributes: BaseAttributes;

    constructor(from?: BaseFieldBuilder<Kind, Optional>) {
        const attributes = from ? from.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    abstract get kind(): Kind;

    protected abstract clone(): BaseFieldBuilder<Kind, Optional>;


    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    get description(): NullField['description'] { return this.#attributes.description; }

    describe(description?: string): BaseFieldBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#attributes.description = description;

        return builder;
    }

    optional(): BaseFieldBuilder<Kind, true> {
        const builder = this.clone();

        builder.#attributes.isOptional = false;

        return builder as BaseFieldBuilder<Kind, true>;

    };
    required(): BaseFieldBuilder<Kind, false> {
        const builder = this.clone();

        builder.#attributes.isOptional = true;

        return builder as BaseFieldBuilder<Kind, false>;
    }
}
