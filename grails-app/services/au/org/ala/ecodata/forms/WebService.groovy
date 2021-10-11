/*
 * Copyright (C) 2013 Atlas of Living Australia
 * All Rights Reserved.
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 */

package au.org.ala.ecodata.forms
/**
 * Placeholder for the WebService class in BioCollect/Ecodata.  TODO Fix this.
 * Using the ala-ws-plugin version is causing AST exceptions during the grails prod maven deploy in travis.
 */
class WebService {

    def grailsApplication

    /** This isn't used! In both BioCollect and MERIT the WebService class is replaced by a locally defined service */
    def getJson(String url, Integer timeout = null, boolean includeApiKey = false) {
        [:]
    }

    def doPostWithParams(String url, Map params) {
        [:]
    }
}
