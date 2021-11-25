/*
Handles the display and editing of UTC dates.

Declares a Knockout extender that allows UTC ISODates to be displayed and edited as simple dates in the form
 dd-MM-yyyy and with local timezone adjustment. Hours and minutes can optionally be shown and edited.

Declares a custom binding that allows dates to be changed using the Bootstrap datepicker
 (https://github.com/eternicode/bootstrap-datepicker).

The date values in the ViewModel are maintained as UTC dates as strings in ISO format (ISO8601 without milliseconds).

The extender adds a 'formattedDate' property to the observable. It is this property that should be bound
 to an element, eg

    <input data-bind="value: myDate.formattedDate" type=...../> or
    <span data-bind="text: myDate.formattedDate" />

The date is defined in the view model like this:

    self.myDate = ko.observable("${myDate}").extend({simpleDate: false});

The boolean indicates whether to show the time as well.

The extender also adds a 'date' property to the observable that holds the value as a Javascript date object.
This is used by the datepicker custom binding.

The custom binding listens for changes via the datepicker as well as direct edits to the input field and
 updates the model. It also updates the datepicker on change to the model.

*/

(function(){

    // creates an ISO8601 date string but without millis - to match the format used by the java thingy for BSON dates
    Date.prototype.toISOStringNoMillis = function() {
        function pad(n) { return n < 10 ? '0' + n : n }
        return this.getUTCFullYear() + '-'
            + pad(this.getUTCMonth() + 1) + '-'
            + pad(this.getUTCDate()) + 'T'
            + pad(this.getUTCHours()) + ':'
            + pad(this.getUTCMinutes()) + ':'
            + pad(this.getUTCSeconds()) + 'Z';
    };

    // Use native ISO date parsing or shim for old browsers (IE8)
    var D= new Date('2011-06-02T09:34:29+02:00');
    if(!D || +D!== 1307000069000){
        Date.fromISO= function(s){
            var day, tz,
                rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
                p= rx.exec(s) || [];
            if(p[1]){
                day= p[1].split(/\D/);
                for(var i= 0, L= day.length; i<L; i++){
                    day[i]= parseInt(day[i], 10) || 0;
                }
                day[1]-= 1;
                day= new Date(Date.UTC.apply(Date, day));
                if(!day.getDate()) return NaN;
                if(p[5]){
                    tz= (parseInt(p[5], 10)*60);
                    if(p[6]) tz+= parseInt(p[6], 10);
                    if(p[4]== '+') tz*= -1;
                    if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
                }
                return day;
            }
            return NaN;
        }
    }
    else{
        Date.fromISO= function(s){
            return new Date(s);
        }
    }
})();

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" )
        return false;
    return !isNaN(d.getTime());
}

function convertToSimpleDate(isoDate, includeTime) {
    if (!isoDate) { return ''}
    if (typeof isoDate === 'object') {
        // assume a date object
        if (!isValidDate(isoDate)) {
            return '';
        }
    }
    // Format the stage labels using Melbourne/Sydney/Canberra time to avoid problems where the date starts
    // at midnight and displays as the previous day in other timezones.
    var date = moment.tz(isoDate, "Australia/Sydney");
    var format = includeTime ? "DD-MM-YYYY HH:mm" : "DD-MM-YYYY";
    return date.format(format);
}

/**
 * Displays the supplied date as the financial year it falls into.  *Note* this routine will subtract
 * a day from the supplied date to catch report ranges that start and end on the 1st of July. e.g. 30-06-2017T14:00:00Z - 30-06-2017T14:00:00Z
 *
 * @param date the date to format - must be a ISO 8601 formatted string.
 * @return a String of the form "2016 / 2017"
 */
function isoDateToFinancialYear(date) {
    var parsedDate = moment(date).subtract(1, 'days');
    var year = parsedDate.year();
    // If the month is July - December, the financial year ends with the following year
    if (parsedDate.month() >= 6) {
        year++;
    }

    return (year-1) + '/' + year;
}

function convertToIsoDate(date) {
    if (typeof date === 'string') {
        if (date.length === 20 && date.charAt(19) === 'Z') {
            // already an ISO date string
            return date;
        } else if (date.length > 9){
            // assume a short date of the form dd-mm-yyyy
            var year = date.substr(6,4),
                month = Number(date.substr(3,2))- 1,
                day = date.substr(0,2),
                hours = date.length > 12 ? date.substr(11,2) : 0,
                minutes = date.length > 15 ? date.substr(14,2) : 0;
            var dt = new Date(year, month, day, hours, minutes);
            if (isValidDate(dt)) {
                return dt.toISOStringNoMillis();
            }
            else {
                return '';
            }
        } else {
            return '';
        }
    } else if (typeof date === 'object') {
        // assume a date object
        if (isValidDate(date)) {
            return date.toISOStringNoMillis();
        }
        else {
            return '';
        }

    } else {
        return '';
    }
}

function stringToDate(date) {
    if (typeof date === 'string') {
        if (date.length === 20 && date.charAt(19) === 'Z') {
            // already an ISO date string
            return Date.fromISO(date);
        } else if (date.length > 9){
            // assume a short date of the form dd-mm-yyyy
            var year = date.substr(6,4),
                month = Number(date.substr(3,2))- 1,
                day = date.substr(0,2),
                hours = date.length > 12 ? date.substr(11,2) : 0,
                minutes = date.length > 15 ? date.substr(14,2) : 0;
            return new Date(year, month, day, hours, minutes);
        } else {
            return undefined;
        }
    } else if (typeof date === 'object') {
        // assume a date object
        return date;
    } else {
        return undefined;
    }
}


/* From:
 * jQuery File Upload User Interface Plugin 6.8.1
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
function formatBytes(bytes) {
    if (typeof bytes !== 'number') {
        return '';
    }
    if (bytes >= 1000000000) {
        return (bytes / 1000000000).toFixed(2) + ' GB';
    }
    if (bytes >= 1000000) {
        return (bytes / 1000000).toFixed(2) + ' MB';
    }
    return (bytes / 1000).toFixed(2) + ' KB';
}

/**
 * It is for  projects which contain a list of site ids instead of sites
 * e.g workprojects
 * @param sites
 * @param addNotFoundSite
 * @returns {Array}
 */
function resolveSites(sites, addNotFoundSite) {
    var resolved = [];
    sites = sites || [];

    sites.forEach(function (siteId) {
        var site;
        if(typeof siteId === 'string'){
            site = lookupSite(siteId);

            if(site){
                resolved.push(site);
            } else if(addNotFoundSite && siteId) {
                resolved.push({
                    name: 'User created site',
                    siteId: siteId
                });
            }
        } else if(typeof siteId === 'object'){
            resolved.push(siteId);
        }
    });

    return resolved;
}
