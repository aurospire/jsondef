import { ModelSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class ModelSchemaBuilder<const Of extends ModelSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'model', Optional>
    implements ModelSchema {

    #of: Of;

    #name: string;

    constructor(from: ModelSchemaBuilder<Of, Optional> | Of, name: string) {
        super(from instanceof ModelSchemaBuilder ? from : undefined);

        this.#of = from instanceof ModelSchemaBuilder ? from.#of : from;

        this.#name = name;
    }

    get kind(): "model" { return 'model'; }

    get of(): Of { return this.#of; }

    get name(): string { return this.#name; }


    override optional(): ModelSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): ModelSchemaBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new ModelSchemaBuilder<Of, Optional>(this, this.name); }
}
