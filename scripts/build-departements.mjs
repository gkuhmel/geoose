// Construit src/data/departements.json (TopoJSON compact) à partir du GeoJSON simplifié des départements
// de France métropolitaine : https://github.com/gregoiredavid/france-geojson (departements-version-simplifiee.geojson)
// Source des tracés : IGN – Admin Express (Licence ouverte Etalab).
// Usage : node scripts/build-departements.mjs chemin/vers/departements-version-simplifiee.geojson
import fs from "fs";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { quantize } from "topojson-client";
import { geoArea } from "d3-geo";
const src = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const f of src.features) {
  f.properties = { code: f.properties.code, nom: f.properties.nom };
  // d3 veut les contours extérieurs dans le sens horaire (convention inverse du GeoJSON RFC 7946) :
  // sinon un département « contient » toute la Terre sauf lui-même
  if (geoArea(f) > 2 * Math.PI) {
    const rev = poly => poly.map(r => r.slice().reverse());
    f.geometry.coordinates = f.geometry.type === "Polygon" ? rev(f.geometry.coordinates) : f.geometry.coordinates.map(rev);
  }
}
let t = topology({ departements: src }, 1e5);
t = presimplify(t);
t = simplify(t, quantile(t, 0.55)); // garde ~55 % des points : largement assez net, même zoomé
t = quantize(t, 2e4); // coordonnées entières (précision ~50 m) : fichier bien plus petit
fs.writeFileSync("src/data/departements.json", JSON.stringify(t));
console.log("départements :", src.features.length, "→", fs.statSync("src/data/departements.json").size, "octets");
