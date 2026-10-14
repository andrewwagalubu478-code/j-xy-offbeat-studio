import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type CompositionError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "notFound";
    notFound: bigint;
} | {
    __kind__: "invalidName";
    invalidName: null;
};
export interface CompositionView {
    id: bigint;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    payload: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Result = {
    __kind__: "ok";
    ok: CompositionView;
} | {
    __kind__: "err";
    err: CompositionError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: CompositionError;
};
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Delete one of the caller's saved compositions.
     */
    deleteComposition(id: bigint): Promise<Result_1>;
    execute(qJson: string): Promise<Result__1>;
    /**
     * / Return the backend's public API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch one of the caller's saved compositions by id.
     */
    getComposition(id: bigint): Promise<CompositionView | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's saved compositions, newest first.
     */
    listCompositions(): Promise<Array<CompositionView>>;
    /**
     * / Save a new composition for the caller.
     */
    saveComposition(name: string, payload: string): Promise<Result>;
    schema(): Promise<string>;
    /**
     * / Update an existing composition owned by the caller.
     */
    updateComposition(id: bigint, name: string, payload: string): Promise<Result>;
}
