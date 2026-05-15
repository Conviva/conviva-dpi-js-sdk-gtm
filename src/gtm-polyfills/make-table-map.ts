// Polyfill of GTM's makeTableMap API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#maketablemap
//
// Turns an array of {<keyName>: K, <valueName>: V} rows into a map { K: V }.
// Returns null for an empty/invalid table to match GTM's behaviour.

function makeTableMap(
  table: Array<Record<string, any>>,
  keyName: string,
  valueName: string,
): Record<string, any> | null {
  if (!Array.isArray(table) || table.length === 0) {
    return null;
  }
  const map: Record<string, any> = {};
  for (const row of table) {
    if (row && row[keyName] != null) {
      map[row[keyName]] = row[valueName];
    }
  }
  return Object.keys(map).length > 0 ? map : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = makeTableMap;
}

export default makeTableMap;
