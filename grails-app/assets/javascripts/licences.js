var ecodataLicences = {
    options: ko.observableArray([]),
    json: null,
    load: function() {
        var config = document.querySelector('[data-ecodata-licences]');
        if (config) {
            var json = config.getAttribute('data-ecodata-licences');
            if (ecodataLicences.json !== json) {
                var options = JSON.parse(json);
                ecodataLicences.json = json;
                ecodataLicences.options(options);
            }
        }
    },
    find: function(value) {
        return ecodataLicences.options().find(function(licence) {
            return licence.value === value || (licence.url && licence.url === value) || (licence.aliases || []).indexOf(value) !== -1;
        }) || null;
    },
    valueFor: function(value) {
        ecodataLicences.load();
        var match = ecodataLicences.find(value);
        return match ? match.value : undefined;
    },
    optionsFor: function(value) {
        var options = ecodataLicences.options().slice();
        if (value && !options.some(function(option) { return option.value === value; })) {
            options.push({value: value, name: ecodataLicences.descriptionFor(value)});
        }
        return options;
    },
    descriptionFor: function(value) {
        var match = ecodataLicences.find(value);
        return match ? match.name : (value || '');
    },
    shortNameFor: function(option) {
        var match = ecodataLicences.find(option.value);
        return match ? (match.shortName || match.value) : option.value;
    },
    urlFor: function(value) {
        var match = ecodataLicences.find(value);
        var url = match && match.url;
        return url && /^https?:\/\//i.test(url) ? url : '';
    }
};