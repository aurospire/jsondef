import { Field, ArrayField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";


export class ArrayFieldBuilder<Of extends Field, Optional extends boolean = false> extends PositiveBoundedFieldBuilder<'array', Optional> implements ArrayField {
    #of: Of;

    constructor(from: ArrayFieldBuilder<Of, Optional> | Of) {
        super(from instanceof ArrayFieldBuilder ? from : undefined);

        this.#of = from instanceof ArrayFieldBuilder ? from.#of : from;
    }

    override get kind(): "array" { return 'array'; }

    optional(): ArrayFieldBuilder<Of, true> { return super.optional() as any; }

    required(): ArrayFieldBuilder<Of, false> { return super.required() as any; }

    get of() { return this.#of; }

    clone() { return new ArrayFieldBuilder<Of, Optional>(this); }
}
