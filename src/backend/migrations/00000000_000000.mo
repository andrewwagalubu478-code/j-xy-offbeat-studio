import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  public type OldActor = {};

  type Composition = {
    id : Nat;
    owner : Principal;
    name : Text;
    payload : Text;
    createdAt : Nat;
    updatedAt : Nat;
  };

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    compositions : Map.Map<Nat, Composition>;
    nextId : { var value : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      compositions = Map.empty();
      nextId = { var value = 0 };
    };
  };
};
