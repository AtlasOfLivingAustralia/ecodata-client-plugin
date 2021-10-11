package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import org.grails.web.servlet.mvc.GrailsWebRequest
import spock.lang.Specification

/*
 * Copyright (C) 2020 Atlas of Living Australia
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
 * 
 * Created by Temi on 5/6/20.
 */

class UserInfoServiceSpec extends Specification implements ServiceUnitTest<UserInfoService> {
    WebService webService = Mock(WebService)
    def authService = Mock(AuthService)
    def request = Mock(GrailsWebRequest)
    def user
    def userName
    def key
    def setup() {
        userName = "test@gmail.com"
        key = "abcdefg"
        user = [firstName: "first", lastName: "last", userName: "test@gmail.com", 'userId': 4000]
        grailsApplication.config.mobile = [auth:[check:[url: 'checkURL']]]
        grailsApplication.config.userDetails = [url: 'userDetails/']
        service.webService = webService
        service.authService = authService
        service.grailsApplication = grailsApplication
    }

    def cleanup() {
    }

    void "getUserFromAuthKey user profile when key & username are passed"() {
        setup:
        def result

        when:
        result = service.getUserFromAuthKey(userName, key)

        then:
        1 * webService.doPostWithParams(grailsApplication.config.mobile.auth.check.url, [userName: userName, authKey: key]) >> [ statusCode: 200, resp: [status: "success"]]
        1 * webService.doPostWithParams("${grailsApplication.config.userDetails.url}userDetails/getUserDetails", [userName: userName]) >> [ statusCode: 200, resp: user]
        result.size() == 3
        result.firstName == null
        result.displayName == "first last"

        when:
        result = service.getUserFromAuthKey(userName, key)

        then:
        1 * webService.doPostWithParams(grailsApplication.config.mobile.auth.check.url, [userName: userName, authKey: key]) >> [ statusCode: 404, resp: [status: "error"]]
        0 * webService.doPostWithParams("${grailsApplication.config.userDetails.url}userDetails/getUserDetails", [userName: userName])
        result == null
    }

    void "getCurrentUser should get current user from CAS"() {
        setup:
        def result

        when:
        result = service.getCurrentUser()
        result.size() == user.size()

        then:
        1 * authService.userDetails() >> user

        when:
        result = service.getCurrentUser()

        then:
        1 * authService.userDetails() >> null
        result == null
    }
}

class AuthService {
    def userDetails () {
        [:]
    }
}
