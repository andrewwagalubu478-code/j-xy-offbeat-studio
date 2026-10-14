import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import CompositionsLib "../lib/compositions";
import Types "../types/compositions";

mixin (
  compositions : Map.Map<Nat, Types.Composition>,
  nextId : { var value : Nat },
) {
  /// List the caller's saved compositions, newest first.
  public query ({ caller }) func listCompositions() : async [Types.CompositionView] {
    CompositionsLib.listCompositions(compositions, caller);
  };

  /// Fetch one of the caller's saved compositions by id.
  public query ({ caller }) func getComposition(id : Nat) : async ?Types.CompositionView {
    CompositionsLib.getComposition(compositions, caller, id);
  };

  /// Save a new composition for the caller.
  public shared ({ caller }) func saveComposition(
    name : Text,
    payload : Text,
  ) : async Result.Result<Types.CompositionView, Types.CompositionError> {
    CompositionsLib.saveComposition(compositions, nextId, caller, name, payload);
  };

  /// Update an existing composition owned by the caller.
  public shared ({ caller }) func updateComposition(
    id : Nat,
    name : Text,
    payload : Text,
  ) : async Result.Result<Types.CompositionView, Types.CompositionError> {
    CompositionsLib.updateComposition(compositions, caller, id, name, payload);
  };

  /// Delete one of the caller's saved compositions.
  public shared ({ caller }) func deleteComposition(
    id : Nat,
  ) : async Result.Result<(), Types.CompositionError> {
    CompositionsLib.deleteComposition(compositions, caller, id);
  };
};
