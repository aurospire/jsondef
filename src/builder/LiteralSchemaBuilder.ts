import { LiteralSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class LiteralSchemaBuilder<const Of extends LiteralSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'literal', Optional>
    implements LiteralSchema {

    #of: Of;

    constructor(from: LiteralSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof LiteralSchemaBuilder ? from : undefined);

        if (typeof from === 'number' && (Number.isNaN(from) || !Number.isFinite(from)))
            throw new Error(`LiteralSchema cannot be ${from}`);

        this.#of = from instanceof LiteralSchemaBuilder ? from.#of : from;
    }

    override get kind(): "literal" { return 'literal'; }

    get of() { return this.#of; }


    override optional(): LiteralSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): LiteralSchemaBuilder<Of, false> { return super.required() as any; }


    protected override clone(): LiteralSchemaBuilder<Of, Optional> { return new LiteralSchemaBuilder<Of, Optional>(this); }
}
