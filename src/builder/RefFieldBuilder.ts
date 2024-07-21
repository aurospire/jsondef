import { RefField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class RefFieldBuilder<Of extends RefField['of'], Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'ref', Optional>
    implements RefField {

    #of: Of;

    constructor(from: RefFieldBuilder<Of, Optional> | Of) {
        super(from instanceof RefFieldBuilder ? from : undefined);

        this.#of = from instanceof RefFieldBuilder ? from.#of : from;
    }

    get kind(): "ref" { return 'ref'; }

    get of(): Of { return this.#of; }

    override optional(): RefFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): RefFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new RefFieldBuilder<Of, Optional>(this); }
}