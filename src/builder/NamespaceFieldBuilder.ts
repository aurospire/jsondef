import { NamespaceField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class NamespaceFieldBuilder<const Of extends NamespaceField['of'], const Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'namespace', Optional>
    implements NamespaceField {

    #of: Of;

    constructor(from: NamespaceFieldBuilder<Of, Optional> | Of) {
        super(from instanceof NamespaceFieldBuilder ? from : undefined);

        this.#of = from instanceof NamespaceFieldBuilder ? from.#of : from;
    }

    get kind(): "namespace" { return 'namespace'; }

    get of(): Of { return this.#of; }

    override optional(): NamespaceFieldBuilder<Of, true> { return super.optional() as any; }

    override required(): NamespaceFieldBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new NamespaceFieldBuilder<Of, Optional>(this); }
}