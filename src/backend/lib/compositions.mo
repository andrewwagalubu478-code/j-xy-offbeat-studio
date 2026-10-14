import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/compositions";

module {
  /// Convert an internal composition to its shared view.
  public func toView(composition : Types.Composition) : Types.CompositionView {
    {
      id = composition.id;
      name = composition.name;
      payload = composition.payload;
      createdAt = composition.createdAt;
      updatedAt = composition.updatedAt;
    };
  };

  /// List every composition owned by `caller`, newest first.
  public func listCompositions(
    compositions : Map.Map<Nat, Types.Composition>,
    caller : Principal,
  ) : [Types.CompositionView] {
    let owned = compositions.values().filter(func(c) = Principal.equal(c.owner, caller));
    let views = owned.map(toView).toArray();
    views.sort(func(a, b) = Nat.compare(b.createdAt, a.createdAt));
  };

  /// Fetch a single composition owned by `caller`.
  public func getComposition(
    compositions : Map.Map<Nat, Types.Composition>,
    caller : Principal,
    id : Nat,
  ) : ?Types.CompositionView {
    switch (compositions.get(id)) {
      case (?composition) {
        if (Principal.equal(composition.owner, caller)) {
          ?toView(composition);
        } else {
          null;
        };
      };
      case null { null };
    };
  };

  /// Persist a new composition for `caller` and return its view.
  public func saveComposition(
    compositions : Map.Map<Nat, Types.Composition>,
    nextId : { var value : Nat },
    caller : Principal,
    name : Text,
    payload : Text,
  ) : Result.Result<Types.CompositionView, Types.CompositionError> {
    let trimmed = name.trim(#predicate(func(c) = c == ' '));
    if (trimmed == "") {
      return #err(#invalidName);
    };
    let id = nextId.value;
    nextId.value := id + 1;
    let now = Time.now().toNat();
    let composition : Types.Composition = {
      id;
      owner = caller;
      name = trimmed;
      payload;
      createdAt = now;
      updatedAt = now;
    };
    compositions.add(id, composition);
    #ok(toView(composition));
  };

  /// Update the name and payload of an existing composition owned by `caller`.
  public func updateComposition(
    compositions : Map.Map<Nat, Types.Composition>,
    caller : Principal,
    id : Nat,
    name : Text,
    payload : Text,
  ) : Result.Result<Types.CompositionView, Types.CompositionError> {
    switch (compositions.get(id)) {
      case (?composition) {
        if (not Principal.equal(composition.owner, caller)) {
          return #err(#notAuthorized);
        };
        let trimmed = name.trim(#predicate(func(c) = c == ' '));
        if (trimmed == "") {
          return #err(#invalidName);
        };
        let updated : Types.Composition = {
          id = composition.id;
          owner = composition.owner;
          name = trimmed;
          payload;
          createdAt = composition.createdAt;
          updatedAt = Time.now().toNat();
        };
        compositions.add(id, updated);
        #ok(toView(updated));
      };
      case null { #err(#notFound(id)) };
    };
  };

  /// Delete a composition owned by `caller`.
  public func deleteComposition(
    compositions : Map.Map<Nat, Types.Composition>,
    caller : Principal,
    id : Nat,
  ) : Result.Result<(), Types.CompositionError> {
    switch (compositions.get(id)) {
      case (?composition) {
        if (not Principal.equal(composition.owner, caller)) {
          return #err(#notAuthorized);
        };
        compositions.remove(id);
        #ok(());
      };
      case null { #err(#notFound(id)) };
    };
  };
};
