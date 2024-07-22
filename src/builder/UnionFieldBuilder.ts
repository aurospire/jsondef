import { UnionField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class UnionFieldBuilder<const Of extends UnionField['of'], const Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'union', Optional>
    implements UnionField {

    #of: Of;

    constructor(from: UnionFieldBuilder<Of, Optional> | Of) {
        super(from instanceof UnionFieldBuilder ? from : undefined);

        this.#of = from instanceof UnionFieldBuilder ? from.#of : from;
    }

    get kind(): "union" { return 'union'; }

    get of(): Of { return this.#of; }

    override optional(): UnionFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): UnionFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new UnionFieldBuilder<Of, Optional>(this); }
}