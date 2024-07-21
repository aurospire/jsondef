import { CompositeField } from "../Field";
import { InferField } from "../Infer";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class CompositeFieldBuilder<Of extends CompositeField['of'], Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'composite', Optional>
    implements CompositeField {

    #of: Of;

    constructor(from: CompositeFieldBuilder<Of, Optional> | Of) {
        super(from instanceof CompositeFieldBuilder ? from : undefined);

        this.#of = from instanceof CompositeFieldBuilder ? from.#of : from;
    }

    get kind(): "composite" { return 'composite'; }

    get of(): Of { return this.#of; }

    override optional(): CompositeFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): CompositeFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new CompositeFieldBuilder<Of, Optional>(this); }


    get infer(): InferField<{ kind: 'composite', isOptional: Optional; of: Of; }> {
        throw new Error('Type helper method');
    }
}