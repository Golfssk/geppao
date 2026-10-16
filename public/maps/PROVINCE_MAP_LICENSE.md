# Province explorer — sources, attribution and limitations

## District boundaries (77 provinces, 928 district-level units)

Royal Thai Survey Department and OCHA ROAP, distributed via geoBoundaries gbOpen Thailand ADM2. Represented year **2019**, boundary ID **THA-ADM2-78962969**. Source includes Bangkok's 50 khet. This snapshot is not a claim about today's legal administrative boundaries.

- Metadata: https://www.geoboundaries.org/api/current/gbOpen/THA/ADM2/
- Pinned upstream geometry: https://github.com/wmgeolab/geoBoundaries/blob/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/THA/ADM2/geoBoundaries-THA-ADM2_simplified.geojson
- License: Creative Commons Attribution 3.0 Intergovernmental Organisations (CC BY 3.0 IGO), https://creativecommons.org/licenses/by/3.0/igo/
- geoBoundaries methodology: Runfola et al. (2020), https://doi.org/10.1371/journal.pone.0231866

GepPao changes: additional 0.002-degree line simplification; Web Mercator projection into local per-province coordinates; interior label points; matching district names to province parents. Thai names use Kongvut Sangkla's thai-province-data dataset (MIT), with explicit corrections for several English spelling/translation mismatches. The MIT notice is at /maps/THAI_NAMES_LICENSE.txt . Name sources: https://github.com/kongvut/thai-province-data , fetched snapshot 2026-10-16. The country overview retains its separate OSM / geoBoundaries attribution in /maps/THAILAND_MAP_LICENSE.md . All 928 district shapes received a Thai-name match; province parent matching uses the name table rather than relying on centroids across two different boundary snapshots.

This map is illustrative, not cadastral, legal-boundary, access or navigation advice. Small islands and detail may be simplified. Labels are decluttered for readability; every district remains available in the selector.

## Selected points of interest

© OpenStreetMap contributors, Open Database License 1.0 (ODbL-1.0), https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/ . An initial country-wide Overpass snapshot was taken on 2026-10-16. Featured dam/waterfall/visitor-centre points were checked against Nominatim/OSM source results on the same date. Each point carries its original OSM element URL and coordinates. Area-centre points are explicitly distinguished from point nodes; an area centre is **not** an entrance. Selection is limited to 12 unique named points per province and is not a comprehensive or ranked tourism directory. Some provinces have no points in this particular collection.

The OSM-derived points database is offered under ODbL-1.0. The district geometries retain CC BY 3.0 IGO independently. Download index and complete per-province derived collections at /maps/provinces/index.json (each entry links its JSON). Their source/license fields distinguish the two data sources. No user geolocation or personal data is collected.

Map points are **not verified GepPao listings**. Presence does not imply current opening, access rights, availability, endorsement or booking. Onward catalog search returns only existing published records.

## Optional terrain / hillshade

Live raster tiles from Esri's public World Hillshade service:
https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer

Service attribution: Sources: Esri, Vantor, Airbus DS, USGS, NGA, NASA, CGIAR, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen, Rijkswaterstaat, GSA, Geoland, FEMA, Intermap, and the GIS user community.

Description, source information and terms: https://goto.arcgisonline.com/maps/Elevation/World_Hillshade . Terrain is a real hillshade backdrop, **not 3D terrain or a navigation elevation model**. It is clipped to the province district collection and aligned in Web Mercator. Tiles are loaded only after province drill-down, with at most 20 fit-level requests per selected province (not a bulk downloader). The user can turn the layer off. If tiles fail, local boundaries, selectors and points remain usable; the UI reports missing terrain. No provider account, paid plan or API key is created. Availability, licensing terms and provider limits should be rechecked before high-volume public deployment; this feature does not promise unlimited third-party service.
