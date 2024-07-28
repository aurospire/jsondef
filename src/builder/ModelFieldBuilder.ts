import { ModelField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class ModelFieldBuilder<const Of extends ModelField['of'], const Optional extends boolean = false>
    extends BaseFieldBuilder<'model', Optional>
    implements ModelField {

    #of: Of;

    #name: string;

    constructor(from: ModelFieldBuilder<Of, Optional> | Of, name: string) {
        super(from instanceof ModelFieldBuilder ? from : undefined);

        this.#of = from instanceof ModelFieldBuilder ? from.#of : from;

        this.#name = name;
    }

    get kind(): "model" { return 'model'; }

    get of(): Of { return this.#of; }

    get name(): string { return this.#name; }


    override optional(): ModelFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): ModelFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new ModelFieldBuilder<Of, Optional>(this, this.name); }
}
