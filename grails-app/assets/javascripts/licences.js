var ecodataLicences = {
    options: ko.observableArray([]),
    catalogue: ko.observableArray([]),
    defaultLicence: ko.observable('https://creativecommons.org/licenses/by/4.0/'),
    json: null,
    catalogueJson: null,
    load: function() {
        var config = document.querySelector('[data-ecodata-licences]');
        if (config) {
            var json = config.getAttribute('data-ecodata-licences');
            var catalogueJson = config.getAttribute('data-ecodata-licence-catalogue');
            var defaultLicence = config.getAttribute('data-ecodata-default-licence');
            ecodataLicences.defaultLicence(defaultLicence !== null ? defaultLicence : 'https://creativecommons.org/licenses/by/4.0/');
            if (catalogueJson === null) {
                throw new Error('Licence catalogue metadata is missing');
            }
            if (ecodataLicences.catalogueJson !== catalogueJson) {
                var catalogue = JSON.parse(catalogueJson);
                if (!Array.isArray(catalogue)) {
                    throw new Error('Licence catalogue must be an array');
                }
                ecodataLicences.catalogueJson = catalogueJson;
                ecodataLicences.catalogue(catalogue);
            }
            if (ecodataLicences.json !== json) {
                var options = JSON.parse(json);
                if (!Array.isArray(options)) {
                    throw new Error('Licence options must be an array');
                }
                ecodataLicences.json = json;
                ecodataLicences.options(options);
            }
        }
    },
    // These are previously stored image codes, not aliases between licence versions.
    legacyUrls: {
        'CC BY 0': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'CC BY': 'https://creativecommons.org/licenses/by/4.0/',
        'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
        'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
        'CC BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
        'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
        'CC BY-NC': 'https://creativecommons.org/licenses/by-nc/4.0/',
        'CC BY-NC-SA': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    },
    normaliseUrl: function(value) {
        return typeof value === 'string' ? value.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '') : '';
    },
    find: function(value) {
        var url = ecodataLicences.normaliseUrl(ecodataLicences.legacyUrls[value] || value);
        return ecodataLicences.catalogue().find(function(licence) {
            return licence.acronym === value || ecodataLicences.normaliseUrl(licence.url) === url;
        }) || null;
    },
    isAllowed: function(licence) {
        return ecodataLicences.options().some(function(option) {
            return ecodataLicences.normaliseUrl(option.url) === ecodataLicences.normaliseUrl(licence.url);
        });
    },
    valueFor: function(value) {
        ecodataLicences.load();
        var match = ecodataLicences.find(value);
        return match ? match.acronym : undefined;
    },
    defaultValue: function(field) {
        ecodataLicences.load();
        var value = ecodataLicences.defaultLicence();
        var match = ecodataLicences.find(value);
        return match ? match[field || 'acronym'] : value;
    },
    optionsFor: function(value) {
        var options = ecodataLicences.options().slice();
        var match = ecodataLicences.find(value);
        if (value && (!match || !ecodataLicences.isAllowed(match))) {
            options.push(match || {acronym: value, name: value, url: value, imageUrl: '', version: ''});
        }
        return options;
    },
    descriptionFor: function(value) {
        var match = ecodataLicences.find(value);
        return match ? match.name + ' (' + match.acronym + ')' : (value || '');
    },
    shortNameFor: function(option) {
        return option.acronym;
    },
    urlFor: function(value) {
        var match = ecodataLicences.find(value);
        var url = match ? match.url : value;
        return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : '';
    }
};

function LicenceViewModel(value, field) {
    var self = this;
    field = field || 'acronym';
    self.value = value;
    self.selection = ko.pureComputed({
        read: function() {
            var match = ecodataLicences.find(value());
            return match ? match[field] : value();
        },
        write: function(selected) {
            if (selected !== self.selection()) {
                value(selected);
            }
        }
    });
    self.options = ko.pureComputed(function() {
        return ecodataLicences.optionsFor(value());
    });
    self.description = ko.pureComputed(function() {
        return ecodataLicences.descriptionFor(value());
    });
    self.url = ko.pureComputed(function() {
        return ecodataLicences.urlFor(value());
    });
    self.warning = ko.pureComputed(function() {
        var match = ecodataLicences.find(value());
        if (value() && !match) {
            return 'Unrecognised licence. The existing value has been retained; select an allowed licence to change it.';
        }
        if (value() && !ecodataLicences.isAllowed(match)) {
            return 'This licence is not in the allowlist. The existing value has been retained; select an allowed licence to change it.';
        }
        return !value() && !ecodataLicences.find(ecodataLicences.defaultLicence()) ?
            'The configured default licence is unavailable. Select a licence.' : '';
    });
}
