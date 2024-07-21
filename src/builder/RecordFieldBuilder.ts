import { Field, RecordField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class RecordFieldBuilder<Of extends Field, Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'record', Optional>
    implements RecordField {

    #of: Of;

    constructor(from: RecordFieldBuilder<Of, Optional> | Of) {
        super(from instanceof RecordFieldBuilder ? from : undefined);

        this.#of = from instanceof RecordFieldBuilder ? from.#of : from;
    }

    get kind(): "record" { return 'record'; }

    get of(): Of { return this.#of; }

    override optional(): RecordFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): RecordFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new RecordFieldBuilder<Of, Optional>(this); }
}