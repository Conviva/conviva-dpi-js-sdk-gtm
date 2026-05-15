// Polyfill of GTM's Object API.
// https://developers.google.com/tag-platform/tag-manager/templates/api#object
//
// GTM's Object provides keys/values/entries/freeze plus a `delete` method
// (which native Object lacks). We wrap window.Object and tack on `delete`.

const GtmObject: any = {
  keys: (o: any) => Object.keys(o),
  values: (o: any) => Object.values(o),
  entries: (o: any) => Object.entries(o),
  freeze: (o: any) => Object.freeze(o),
  delete: (o: any, prop: string) => {
    delete o[prop];
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GtmObject;
}

export default GtmObject;
