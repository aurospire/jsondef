import { NullField } from "../Field";
import { InferField } from "../Infer";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class NullFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'null', Optional> implements NullField {
    constructor(from?: NullFieldBuilder<Optional>) { super(from); }

    get kind(): "null" { return 'null'; }

    
    override optional(): NullFieldBuilder<true> { return super.optional() as any; }

    override required(): NullFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new NullFieldBuilder<Optional>(this); }

    get infer(): InferField<{ kind: 'null', isOptional: Optional;}> {
        throw new Error('Type helper method');
    }
}
