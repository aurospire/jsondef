import { TupleSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class TupleSchemaBuilder<
    const Of extends TupleSchema['of'],
    const Rest extends TupleSchema['rest'] = undefined,
    Optional extends boolean = false
>
    extends BaseSchemaBuilder<'tuple', Optional>
    implements TupleSchema {

    #of: Of;

    #rest: Rest;

    constructor(from: TupleSchemaBuilder<Of, Rest, Optional> | Of, rest?: Rest) {
        super(from instanceof TupleSchemaBuilder ? from : undefined);

        this.#of = from instanceof TupleSchemaBuilder ? from.#of : from;

        this.#rest = from instanceof TupleSchemaBuilder ? from.#rest : rest as Rest;
    }

    get kind(): "tuple" { return 'tuple'; }

    get of(): Of { return this.#of; }

    get rest(): Rest { return this.#rest; }

    override optional(): TupleSchemaBuilder<Of, Rest, true> { return super.optional() as any; }

    override required(): TupleSchemaBuilder<Of, Rest, false> { return super.required() as any; }

    protected override clone() { return new TupleSchemaBuilder<Of, Rest, Optional>(this); }
}