/**
 * Vitest setup file – replaces Karma's `files` array.
 *
 * vm.runInThisContext() is used so that var/function declarations in each
 * script become true globals (on globalThis / window), exactly as they would
 * in a browser or when Karma served them to Chrome.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import { vi } from 'vitest';
// Polyfill IndexedDB for Dexie (jsdom does not ship with IndexedDB)
import {
    indexedDB,
    IDBKeyRange,
    IDBCursor,
    IDBCursorWithValue,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBObjectStore,
    IDBRequest,
    IDBOpenDBRequest,
    IDBTransaction,
    IDBVersionChangeEvent,
} from 'fake-indexeddb';

Object.assign(globalThis, {
    indexedDB,
    IDBKeyRange,
    IDBCursor,
    IDBCursorWithValue,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBObjectStore,
    IDBRequest,
    IDBOpenDBRequest,
    IDBTransaction,
    IDBVersionChangeEvent,
});

// ESM-compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function runScript(relativePath) {
    const fullPath = resolve(root, relativePath);
    const code = readFileSync(fullPath, 'utf-8');
    vm.runInThisContext(code, { filename: fullPath });
}

// ---------- jQuery first (many scripts depend on $ / jQuery) ----------
runScript('grails-app/assets/vendor/jquery/3.6.0/jquery.min.js');

// ---------- vendor libs (same order as karma.conf.js `files`) ----------
runScript('grails-app/assets/vendor/bootstrap/5.3/js/bootstrap.bundle.js');
runScript('grails-app/assets/vendor/knockout/3.5.0/knockout.debug.js');
runScript('grails-app/assets/vendor/knockout/3.5.0/knockout.mapping-latest.js');
runScript('grails-app/assets/vendor/select2/4.0.3/js/select2.full.js');
runScript('grails-app/assets/vendor/underscorejs/1.8.3/underscore.js');
runScript('grails-app/assets/vendor/typeahead/0.11.1/bloodhound.js');
runScript('grails-app/assets/vendor/expr-eval/2.0.2/bundle.js');
runScript('grails-app/assets/vendor/jquery.validationEngine/3.1.0/jquery.validationEngine.js');
runScript('grails-app/assets/vendor/jquery.validationEngine/3.1.0/jquery.validationEngine-en.js');
runScript('grails-app/assets/vendor/momentjs/2.29.4/moment.min.js');
runScript('grails-app/assets/vendor/momentjs/2.29.4/locale/en-au.js');
runScript('grails-app/assets/vendor/momentjs/moment-timezone-with-data.min.js');
runScript('grails-app/assets/vendor/validatejs/0.11.1/validate.js');
runScript('grails-app/assets/vendor/dexiejs/dexie.js');

// ---------- application sources ----------
runScript('grails-app/assets/javascripts/utils.js');
runScript('grails-app/assets/javascripts/entities.js');
runScript('grails-app/assets/javascripts/metamodel.js');
runScript('grails-app/assets/javascripts/forms.js');
runScript('grails-app/assets/javascripts/feature.js');
runScript('grails-app/assets/javascripts/forms-knockout-bindings.js');
runScript('grails-app/assets/javascripts/knockout-dates.js');
runScript('grails-app/assets/javascripts/knockout-utils.js');
runScript('grails-app/assets/javascripts/speciesModel.js');
runScript('grails-app/assets/javascripts/uuid.js');
runScript('grails-app/assets/javascripts/viewModels.js');

// ---------- components ----------
runScript('grails-app/assets/components/ecodata-components.js');
runScript('grails-app/assets/components/compile/ecodata-templates.js');
runScript('grails-app/assets/components/javascript/condition-trajectory.js');
runScript('grails-app/assets/components/javascript/multi-input.js');
runScript('grails-app/assets/components/javascript/feature.js');

// ---------- test utilities ----------
runScript('src/test/js/util/FloraDetailsOutputModel.js');
runScript('src/test/js/util/MultiFeatureViewModel.js');
runScript('src/test/js/util/SImpleFeatureViewModel.js');
runScript('src/test/js/util/SimpleExpressionOutputModels.js');
runScript('src/test/js/util/TwiceNestedViewModel.js');

// ============================================================
// jasmine compatibility shim
// Tests call jasmine.Ajax, jasmine.clock(), jasmine.createSpy,
// jasmine.any() etc.  We implement these on top of Vitest's vi.
// ============================================================

// --- jasmine.clock() → vi fake timers ---
const clock = {
    install:   () => vi.useFakeTimers(),
    uninstall: () => vi.useRealTimers(),
    tick:      (ms = 0) => vi.advanceTimersByTime(ms),
};

// --- jasmine.Ajax – minimal XHR intercept shim ---
// Uses Object.defineProperty to override jsdom's non-configurable
// XMLHttpRequest so both native callers AND jQuery are intercepted.
const AjaxShim = (function () {
    let originalDescriptor;
    const requests = [];
    const stubs = [];

    function urlMatches(stubUrl, reqUrl) {
        if (stubUrl instanceof RegExp) return stubUrl.test(reqUrl);
        if (stubUrl === reqUrl) return true;
        function normalize(url) {
            try {
                const u = new URL(url);
                return u.pathname + u.search;
            } catch (e) {
                return url;
            }
        }
        const normStub = normalize(stubUrl);
        const normReq  = normalize(reqUrl);
        if (normStub === normReq) return true;
        const strip = (s) => s.replace(/^\//, '');
        return strip(normStub) === strip(normReq);
    }

    function serializeResponse(opts) {
        opts = opts || {};
        if (opts.responseJSON !== undefined && opts.responseText === undefined) {
            opts = Object.assign({}, opts, {
                responseText: JSON.stringify(opts.responseJSON),
                contentType: opts.contentType || 'application/json',
            });
        }
        return opts;
    }

    function FakeXHR() {
        this.method = null;
        this.url = null;
        this.requestHeaders = {};
        this.responseHeaders = {};
        this.status = 200;
        this.readyState = 0;
        this.responseText = '';
        this.response = '';
        this.statusText = '';
        this.withCredentials = false;
        this.timeout = 0;
    }
    FakeXHR.prototype.open = function (method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1;
        requests.push(this);
    };
    FakeXHR.prototype.setRequestHeader = function (k, v) {
        this.requestHeaders[k] = v;
    };
    FakeXHR.prototype.getResponseHeader = function (k) {
        return this.responseHeaders[k.toLowerCase()] || null;
    };
    FakeXHR.prototype.getAllResponseHeaders = function () {
        return Object.entries(this.responseHeaders)
            .map(([k, v]) => k + ': ' + v)
            .join('\r\n');
    };
    FakeXHR.prototype.overrideMimeType = function () {};
    FakeXHR.prototype.abort = function () {
        this.readyState = 0;
        if (typeof this.onabort === 'function') this.onabort();
    };
    FakeXHR.prototype.send = function (body) {
        this.requestBody = body;
        this.readyState = 2;
        // Search stubs in reverse order so last-added stub wins
        for (let i = stubs.length - 1; i >= 0; i--) {
            const stub = stubs[i];
            if (urlMatches(stub.url, this.url)) {
                this._matchedStub = stub;
                if (stub._error) {
                    this._triggerError(stub._error);
                } else {
                    this._respondWith(serializeResponse(stub._response));
                }
                return;
            }
        }
    };
    FakeXHR.prototype._respondWith = function (opts) {
        opts = opts || {};
        this.status       = opts.status       !== undefined ? opts.status : 200;
        this.statusText   = opts.statusText   !== undefined ? opts.statusText : 'OK';
        this.responseText = opts.responseText !== undefined ? opts.responseText : '';
        this.response     = this.responseText;
        this.readyState   = 4;
        if (opts.contentType) {
            this.responseHeaders['content-type'] = opts.contentType;
        }
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
        if (typeof this.onload === 'function') this.onload();
    };
    FakeXHR.prototype._triggerError = function (opts) {
        opts = opts || {};
        this.status     = opts.status     !== undefined ? opts.status : 0;
        this.statusText = opts.statusText || 'error';
        this.readyState = 4;
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
        if (typeof this.onload === 'function') this.onload();
    };
    FakeXHR.prototype.addEventListener = function (evt, fn) { this['on' + evt] = fn; };
    FakeXHR.prototype.removeEventListener = function () {};
    FakeXHR.prototype.respondWith = function (opts) {
        if (opts === undefined && this._matchedStub) {
            if (this._matchedStub._error) {
                this._triggerError(this._matchedStub._error);
                return;
            }
            opts = this._matchedStub._response;
        }
        this._respondWith(serializeResponse(opts || {}));
    };

    function setXHR(Ctor) {
        try {
            Object.defineProperty(globalThis, 'XMLHttpRequest', {
                configurable: true, writable: true, value: Ctor,
            });
        } catch (e) {
            globalThis.XMLHttpRequest = Ctor;
        }
    }

    const requestsApi = {
        mostRecent: () => requests[requests.length - 1],
        first:      () => requests[0],
        all:        () => requests.slice(),
        reset:      () => { requests.length = 0; },
        count:      () => requests.length,
        at:         (i) => requests[i],
    };

    return {
        install() {
            originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'XMLHttpRequest');
            setXHR(FakeXHR);
            requests.length = 0;
            stubs.length = 0;
        },
        uninstall() {
            if (originalDescriptor) {
                Object.defineProperty(globalThis, 'XMLHttpRequest', originalDescriptor);
            }
            requests.length = 0;
            stubs.length = 0;
        },
        requests: requestsApi,
        stubRequest(url) {
            const stub = { url };
            stubs.push(stub);
            return {
                andReturn(opts)  { stub._response = opts; return stub; },
                andError(opts)   { stub._error    = opts; return stub; },
            };
        },
    };
}());

// --- jasmine.any() asymmetric matcher ---
function jasmineAny(Ctor) {
    return expect.any(Ctor);
}

// --- jasmine.objectContaining() ---
function jasmineObjectContaining(sample) {
    return expect.objectContaining(sample);
}

// --- jasmine.createSpy / jasmine.createSpyObj ---
function createSpy(name) {
    const spy = vi.fn().mockName(name || 'spy');
    spy.and = {
        callFake:    (fn)  => { spy.mockImplementation(fn); return spy; },
        returnValue: (val) => { spy.mockReturnValue(val);   return spy; },
        callThrough: ()    => spy,
        throwError:  (err) => { spy.mockImplementation(() => { throw err instanceof Error ? err : new Error(err); }); return spy; },
    };
    return spy;
}

function createSpyObj(baseName, methods) {
    const obj = {};
    methods.forEach(m => { obj[m] = createSpy(`${baseName}.${m}`); });
    return obj;
}

// Expose on globalThis.jasmine
globalThis.jasmine = {
    clock:            () => clock,
    Ajax:             AjaxShim,
    any:              jasmineAny,
    objectContaining: jasmineObjectContaining,
    createSpy,
    createSpyObj,
};

// Pre-declare implicit globals that legacy spec files assign without `var`.
globalThis.result = undefined;

// spyOn shim — wraps vi.spyOn and attaches .and.*
globalThis.spyOn = function spyOn(obj, method) {
    const spy = vi.spyOn(obj, method);
    spy.and = {
        callFake:    (fn)  => { spy.mockImplementation(fn); return spy; },
        returnValue: (val) => { spy.mockReturnValue(val);   return spy; },
        callThrough: ()    => { spy.mockRestore(); return vi.spyOn(obj, method); },
        throwError:  (err) => { spy.mockImplementation(() => { throw err instanceof Error ? err : new Error(err); }); return spy; },
    };
    return spy;
};

