import { ModelField } from "../Field";
import { InferField } from "../Infer";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";


export class ModelFieldBuilder<Of extends ModelField['of'], Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'model', Optional>
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

    get infer(): InferField<{ kind: 'model', isOptional: Optional; of: Of; name: string; }> {
        throw new Error('Type helper method');
    }
}
