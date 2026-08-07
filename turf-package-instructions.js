// Use npm run-script package-turf
// This will produce turf-packaged.js in grails-app/assets/vendor/turf/turf-packaged.js
// The functions will be exported to a global "turf" namespace.
import areaPackage from '@turf/area';
import lengthPackage from '@turf/length';
import bboxPackage from '@turf/bbox';
import convexPackage from '@turf/convex';
import simplifyPackage from '@turf/simplify';
import clonePackage from '@turf/clone';

const defaultExport = (module) => module.default || module;

const area = defaultExport(areaPackage);
const length = defaultExport(lengthPackage);
const bbox = defaultExport(bboxPackage);
const convex = defaultExport(convexPackage);
const simplify = defaultExport(simplifyPackage);
const clone = defaultExport(clonePackage);

const turf = {
    area,
    length,
    bbox,
    convex,
    simplify,
    clone,
};

if (typeof globalThis !== 'undefined') {
    globalThis.turf = turf;
}

export { area, length, bbox, convex, simplify, clone };
