// ============================================================
// RELATIONS
// Style lookup for relation types and subtypes
// ============================================================

function getRelationStyle(relation) {
  var type    = relation.properties ? relation.properties.node_type    : relation.node_type;
  var subtype = relation.properties ? relation.properties.node_subtype : relation.node_subtype;

  if (relationStyles[type] && relationStyles[type][subtype]) {
    return {
      color:     relationStyles[type][subtype].color,
      weight:    relationStyles[type][subtype].weight,
      dashArray: relationStyles[type][subtype].dashArray,
      opacity:   0.7
    };
  }

  return {
    color:     relationStyles.default.color,
    weight:    relationStyles.default.weight,
    dashArray: relationStyles.default.dashArray,
    opacity:   0.7
  };
}