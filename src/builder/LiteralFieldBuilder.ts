import { LiteralField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class LiteralFieldBuilder<Of extends LiteralField['of'], Optional extends boolean = false>
    extends BaseFieldBuilder<'literal', Optional>
    implements LiteralField {

    #of: Of;

    constructor(from: LiteralFieldBuilder<Of, Optional> | Of) {
        super(from instanceof LiteralFieldBuilder ? from : undefined);

        if (typeof from === 'number' && (Number.isNaN(from) || !Number.isFinite(from)))
            throw new Error(`LiteralField cannot be ${from}`);

        this.#of = from instanceof LiteralFieldBuilder ? from.#of : from;
    }

    override get kind(): "literal" { return 'literal'; }

    get of() { return this.#of; }


    override optional(): LiteralFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): LiteralFieldBuilder<Of, false> { return super.required() as any; }


    protected override clone(): LiteralFieldBuilder<Of, Optional> { return new LiteralFieldBuilder<Of, Optional>(this); }
}
