import { BaseAttributes, BaseField, BoundedAttributes, Field, NullField } from "../Field";


export abstract class FieldBuilder<Kind extends string, Optional extends boolean> implements BaseField<Kind> {
    #attributes: BaseAttributes;

    constructor(from?: FieldBuilder<Kind, Optional>) {
        const attributes = from ? from.#attributes : {};

        this.#attributes = { isOptional: false, ...attributes };
    }

    abstract get kind(): Kind;

    abstract clone(): FieldBuilder<Kind, Optional>;


    get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

    get description(): NullField['description'] { return this.#attributes.description; }

    describe(description?: string): FieldBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#attributes.description = description;

        return builder;
    }

    optional(): FieldBuilder<Kind, true> {
        const builder = this.clone();

        builder.#attributes.isOptional = false;

        return builder as FieldBuilder<Kind, true>;

    };
    required(): FieldBuilder<Kind, false> {
        const builder = this.clone();

        builder.#attributes.isOptional = true;

        return builder as FieldBuilder<Kind, false>;
    }
}

export abstract class BoundedBuilder<Kind extends string, Optional extends boolean> extends FieldBuilder<Kind, Optional> {
    #bounds: BoundedAttributes;

    constructor(from?: BoundedBuilder<Kind, Optional>) {
        super(from);

        const bounds = from ? from.#bounds : {};

        this.#bounds = bounds;
    }

    get min() { return this.#bounds.min; }
    get xmin() { return this.#bounds.xmin; }
    get max() { return this.#bounds.max; }
    get xmax() { return this.#bounds.xmax; }

    bound(bounds: BoundedAttributes): BoundedBuilder<Kind, Optional> {
        const builder = this.clone();

        builder.#bounds = { ...bounds };

        return builder;
    }

    abstract override clone(): BoundedBuilder<Kind, Optional>;
}
