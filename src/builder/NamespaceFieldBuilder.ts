import { NamespaceField } from "../Field";
import { PositiveBoundedFieldBuilder } from "./PositiveBoundedFieldBuilder";

export class NamespaceFieldBuilder<const Of extends NamespaceField['of'], const Main extends string | undefined = undefined, const Optional extends boolean = false>
    extends PositiveBoundedFieldBuilder<'namespace', Optional>
    implements NamespaceField {

    #of: Of;

    #main: Main;


    constructor(from: NamespaceFieldBuilder<Of, Main, Optional> | Of) {
        super(from instanceof NamespaceFieldBuilder ? from : undefined);

        this.#of = from instanceof NamespaceFieldBuilder ? from.#of : from;

        this.#main = from instanceof NamespaceFieldBuilder ? from.#main : undefined as any;
    }

    get kind(): "namespace" { return 'namespace'; }

    get of(): Of { return this.#of; }

    get mainKey(): Main { return this.#main; }


    main<Key extends (string & keyof Of) | undefined>(key: Key): NamespaceFieldBuilder<Of, Key, Optional> {
        const builder = this.clone();

        this.#main = key as any;

        return builder as any;
    }


    override optional(): NamespaceFieldBuilder<Of, Main, true> { return super.optional() as any; }

    override required(): NamespaceFieldBuilder<Of, Main, false> { return super.required() as any; }

    protected override clone() { return new NamespaceFieldBuilder<Of, Main, Optional>(this); }
}