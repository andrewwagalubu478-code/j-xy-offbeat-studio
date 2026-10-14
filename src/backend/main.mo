import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Types "types/compositions";
import CompositionsApi "mixins/compositions-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let compositions : Map.Map<Nat, Types.Composition>;
  let nextId : { var value : Nat };

  transient let sampleOwner = Principal.fromText("aaaaa-aa");

  include MixinAuthorization(accessControlState, null);
  include CompositionsApi(compositions, nextId);
  include ApiDocMixin();
  include Expose({
    entities = [
      compositions.toEntity("composition", "Composition", "id")
        .sample({
          id = 0;
          owner = sampleOwner;
          name = "";
          payload = "";
          createdAt = 0;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
