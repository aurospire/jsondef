import { BaseAttributes, BaseField, NullField } from "../Field";


export abstract class FieldBuilder<Kind extends string, Optional extends boolean> implements BaseField<Kind> {

    #attributes: BaseAttributes;

    constructor(builder?: FieldBuilder<Kind, Optional>) {
        const attributes = builder ? builder.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    abstract get kind(): Kind;

    abstract clone<NewOptional extends boolean = Optional>(): FieldBuilder<Kind, NewOptional>;


    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    get description(): NullField['description'] { return this.#attributes.description; }

    describe(description?: string): FieldBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#attributes.description = description;

        return builder;
    }

    optional(): FieldBuilder<Kind, true> {
        const builder = this.clone<true>();

        builder.#attributes.isOptional = false;

        return builder;

    };
    required(): FieldBuilder<Kind, false> {
        const builder = this.clone<false>();

        builder.#attributes.isOptional = true;

        return builder;
    }

}