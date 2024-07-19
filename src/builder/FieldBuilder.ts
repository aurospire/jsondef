import { BaseAttributes, BaseField, NullField } from "../Field";


export abstract class FieldBuilder<
    Kind extends string,
    Optional extends boolean,
    R extends FieldBuilder<Kind, true, R, O>,
    O extends FieldBuilder<Kind, false, R, O>,
> implements BaseField<Kind> {

    #attributes: BaseAttributes;

    constructor(builder?: R | O) {
        const attributes = builder ? builder.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    abstract get kind(): Kind;

    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    get description(): NullField['description'] { return this.#attributes.description; }

    describe(description?: string): Optional extends true ? R : O {
        const builder = this.isOptional ? this.cloneOptional() : this.cloneRequired();

        builder.#attributes.description = description;

        return builder as Optional extends true ? R : O;
    }

    optional(): O {
        const builder = this.cloneOptional();

        builder.#attributes.isOptional = false;

        return builder;

    }
    required(): R {
        const builder = this.cloneRequired();

        builder.#attributes.isOptional = true;

        return builder;
    }

    abstract cloneOptional(): O;
    
    abstract cloneRequired(): R;
}