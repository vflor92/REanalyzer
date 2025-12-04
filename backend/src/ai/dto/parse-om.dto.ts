export class ParsedField<T> {
    value: T | null;
    sourceSnippet: string | null;
    confidence: number; // 0.0-1.0
}

export class ParseOmResponse {
    name: ParsedField<string>;
    addressLine1: ParsedField<string>;
    city: ParsedField<string>;
    state: ParsedField<string>;
    zip: ParsedField<string>;
    sizeAcres: ParsedField<number>;
    askPriceTotal: ParsedField<number>;
    brokerName: ParsedField<string>;
    brokerCompany: ParsedField<string>;
    brokerEmail: ParsedField<string>;
    listingUrl: ParsedField<string>;
    mudName: ParsedField<string>;
    detentionNotes: ParsedField<string>;
    deedRestrictionsText: ParsedField<string>;
}
