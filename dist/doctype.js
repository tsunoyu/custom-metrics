var dt = document.doctype;
var sDoctype = "";
if ( dt ) {
  sDoctype += dt.name;
  if ( dt.publicId ) {
    sDoctype += " " + dt.publicId;
  }
  if ( dt.systemId ) {
    sDoctype += " " + dt.systemId;
  }
  if ( dt.internalSubset ) {
    sDoctype += " " + dt.internalSubset;
  }
}
/* eslint-disable-next-line no-control-regex */
return sDoctype.replace(/[\x00-\x1F\x80-\xFF]/g, "").toString();
