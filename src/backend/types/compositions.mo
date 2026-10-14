import Common "../types/common";

module {
  /// A saved composition owned by a single caller.
  /// `payload` is opaque JSON produced by the frontend generator; the backend
  /// never interprets its musical structure.
  public type Composition = {
    id : Nat;
    owner : Principal;
    name : Text;
    payload : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Shared view of a composition returned across the API boundary.
  public type CompositionView = {
    id : Nat;
    name : Text;
    payload : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Caller-actionable failures for composition mutations.
  public type CompositionError = {
    #notFound : Nat;
    #notAuthorized;
    #invalidName;
  };
};
