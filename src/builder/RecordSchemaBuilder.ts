import { RecordSchema, SizedAttributes } from "../Schema";
import { SizedSchemaBuilder } from "./SizedSchemaBuilder";

export class RecordSchemaBuilder<const Of extends RecordSchema['of'], const Optional extends boolean = false>
    extends SizedSchemaBuilder<'record', Optional>
    implements RecordSchema {

    #of: Of;

    #key: RecordSchema['key'];

    constructor(from: RecordSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof RecordSchemaBuilder ? from : undefined);

        this.#of = from instanceof RecordSchemaBuilder ? from.#of : from;

        this.#key = from instanceof RecordSchemaBuilder ? from.#key : undefined;
    }

    get kind(): "record" { return 'record'; }

    get of(): Of { return this.#of; }

    get key() { return this.#key; }


    by(key?: RecordSchema['key']): RecordSchemaBuilder<Of, Optional> {
        const builder = this.clone();

        builder.#key = key;

        return builder;
    }

    override optional(): RecordSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): RecordSchemaBuilder<Of, false> { return super.required() as any; }

    override size(size: SizedAttributes): RecordSchemaBuilder<Of, Optional> { return super.size(size) as any; }

    protected override clone() { return new RecordSchemaBuilder<Of, Optional>(this); }
}