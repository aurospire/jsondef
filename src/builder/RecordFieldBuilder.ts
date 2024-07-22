import { RecordField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class RecordFieldBuilder<Of extends RecordField['of'] = undefined, Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'record', Optional>
    implements RecordField {

    #of: Of;

    #key: RecordField['key'];

    constructor(from: RecordFieldBuilder<Of, Optional> | Of) {
        super(from instanceof RecordFieldBuilder ? from : undefined);

        this.#of = from instanceof RecordFieldBuilder ? from.#of : from;

        this.#key = from instanceof RecordFieldBuilder ? from.#key : undefined;
    }

    get kind(): "record" { return 'record'; }

    get of(): Of { return this.#of; }

    get key() { return this.#key; }

    by(key?: RecordField['key']): RecordFieldBuilder<Of, Optional> {
        const builder = this.clone();

        builder.#key = key;

        return builder;
    }

    override optional(): RecordFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): RecordFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new RecordFieldBuilder<Of, Optional>(this); }
}