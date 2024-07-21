import { ObjectField } from "../Field";
import { InferField } from "../Infer";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class ObjectFieldBuilder<Of extends ObjectField['of'], Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'object', Optional>
    implements ObjectField {

    #of: Of;

    constructor(from: ObjectFieldBuilder<Of, Optional> | Of) {
        super(from instanceof ObjectFieldBuilder ? from : undefined);

        this.#of = from instanceof ObjectFieldBuilder ? from.#of : from;
    }

    get kind(): "object" { return 'object'; }

    get of(): Of { return this.#of; }

    override optional(): ObjectFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): ObjectFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new ObjectFieldBuilder<Of, Optional>(this); }

    get infer(): InferField<{ kind: 'object', isOptional: Optional; of: Of}> {
        throw new Error('Type helper method');
    }
}