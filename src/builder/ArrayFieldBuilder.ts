import { ArrayField, BoundedAttributes, Field } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";


export class ArrayFieldBuilder<const Of extends Field, const Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'array', Optional>
    implements ArrayField {

    #of: Of;

    constructor(from: ArrayFieldBuilder<Of, Optional> | Of) {
        super(from instanceof ArrayFieldBuilder ? from : undefined);

        this.#of = from instanceof ArrayFieldBuilder ? from.#of : from;
    }

    override get kind(): "array" { return 'array'; }

    get of() { return this.#of; }


    override optional(): ArrayFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): ArrayFieldBuilder<Of, false> { return super.required() as any; }

    override bound(bounds: BoundedAttributes): ArrayFieldBuilder<Of, Optional> { return super.bound(bounds) as any; }


    protected override clone() { return new ArrayFieldBuilder<Of, Optional>(this); }
}
