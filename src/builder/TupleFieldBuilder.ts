import { TupleField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class TupleFieldBuilder<Of extends TupleField['of'], Rest extends TupleField['rest'] = undefined, Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'tuple', Optional>
    implements TupleField {

    #of: Of;

    #rest: Rest;

    constructor(from: TupleFieldBuilder<Of, Rest, Optional> | Of, rest?: Rest) {
        super(from instanceof TupleFieldBuilder ? from : undefined);

        this.#of = from instanceof TupleFieldBuilder ? from.#of : from;

        this.#rest = from instanceof TupleFieldBuilder ? from.#rest : rest as Rest;
    }

    get kind(): "tuple" { return 'tuple'; }

    get of(): Of { return this.#of; }

    get rest(): Rest { return this.#rest; }

    override optional(): TupleFieldBuilder<Of, Rest, true> { return super.optional() as any; }

    override required(): TupleFieldBuilder<Of, Rest, false> { return super.required() as any; }

    protected override clone() { return new TupleFieldBuilder<Of, Rest, Optional>(this); }
}