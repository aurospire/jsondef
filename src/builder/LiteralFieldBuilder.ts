import { LiteralField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class LiteralFieldBuilder<Optional extends boolean, Of extends boolean | number | string>
    extends BaseFieldBuilder<'literal', Optional>
    implements LiteralField {

    #of: Of;

    constructor(from: LiteralFieldBuilder<Optional, Of> | Of) {
        super(from instanceof LiteralFieldBuilder ? from : undefined);

        if (typeof from === 'number' && (Number.isNaN(from) || !Number.isFinite(from)))
            throw new Error(`LiteralField cannot be ${from}`);

        this.#of = from instanceof LiteralFieldBuilder ? from.#of : from;
    }

    override get kind(): "literal" {
        return 'literal';
    }

    override optional(): LiteralFieldBuilder<true, Of> {
        return super.optional() as LiteralFieldBuilder<true, Of>;
    }

    override required(): LiteralFieldBuilder<false, Of> {
        return super.required() as LiteralFieldBuilder<false, Of>;
    }

    get of() { return this.#of; }

    protected override clone(): LiteralFieldBuilder<Optional, Of> {
        return new LiteralFieldBuilder<Optional, Of>(this);
    }
}
