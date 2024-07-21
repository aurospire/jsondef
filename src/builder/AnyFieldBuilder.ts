import { AnyField } from "../Field";
import { InferField } from "../Infer";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class AnyFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'any', Optional> implements AnyField {
    constructor(from?: AnyFieldBuilder<Optional>) { super(from); }

    get kind(): "any" { return 'any'; }


    override optional(): AnyFieldBuilder<true> { return super.optional() as any; }

    override required(): AnyFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new AnyFieldBuilder<Optional>(this); }

    get infer(): InferField<{ kind: 'any', isOptional: Optional; }> {
        throw new Error('Type helper method');
    }
}
