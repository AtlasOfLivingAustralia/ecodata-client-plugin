package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import grails.testing.web.GrailsWebUnitTest
import org.pac4j.core.config.Config
import org.pac4j.core.credentials.AnonymousCredentials
import org.pac4j.core.credentials.Credentials
import org.pac4j.core.profile.BasicUserProfile
import org.pac4j.core.profile.UserProfile
import org.pac4j.http.client.direct.DirectBearerAuthClient
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

class UserInfoServiceSpec extends Specification implements ServiceUnitTest<UserInfoService>, GrailsWebUnitTest {
    WebService webService = Mock(WebService)
    def authService = Mock(AuthService)
    DirectBearerAuthClient directBearerAuthClient
    Config pack4jConfig

    def user
    def userName
    def key
    def setup() {
        userName = "test@gmail.com"
        key = "abcdefg"
        user = [firstName: "first", lastName: "last", userName: "test@gmail.com", 'userId': 4000]
        grailsApplication.config.mobile = [auth:[check:[url: 'checkURL']], authKeyEnabled: false]
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

    void "getUserFromJWT returns user when Authorization header is passed"() {
        setup:
        def result
        directBearerAuthClient = GroovyMock([global: true], DirectBearerAuthClient)
        pack4jConfig =  GroovyMock([global: true], Config)
        service.directBearerAuthClient = directBearerAuthClient
        service.config = pack4jConfig
        def person = new BasicUserProfile()
        person.build(user.userId, ["given_name": user.firstName, "family_name": user.lastName, "email": user.userName, "userid": user.userId])
        Optional<Credentials> credentials = new Optional<Credentials>(AnonymousCredentials.INSTANCE)
        Optional<UserProfile> userProfile = new Optional<UserProfile>(person)

        when:
        request.addHeader('Authorization', 'Bearer abcdef')
        result = service.getUserFromJWT()

        then:
        directBearerAuthClient.getCredentials(*_) >> credentials
        directBearerAuthClient.getUserProfile(*_) >> userProfile
        result.size() == 3
        result.userName == user.userName
        result.displayName == "${user.firstName} ${user.lastName}"
        result.userId == user.userId
    }

    void "getCurrentUser should get current user from CAS"() {
        setup:
        def result
        directBearerAuthClient = GroovyMock([global: true], DirectBearerAuthClient)
        pack4jConfig =  GroovyMock([global: true], Config)
        service.directBearerAuthClient = directBearerAuthClient
        service.config = pack4jConfig
        def person = new BasicUserProfile()
        person.build(user.userId, ["given_name": "abc", "family_name": "def", "email": user.userName, "userid": user.userId])
        Optional<Credentials> credentials = new Optional<Credentials>(AnonymousCredentials.INSTANCE)
        Optional<UserProfile> userProfile = new Optional<UserProfile>(person)

        when:
        result = service.getCurrentUser()

        then:
        1 * authService.userDetails() >> user
        result.size() == 3

        when:
        request.addHeader('Authorization', 'Bearer abcdef')
        result = service.getCurrentUser()

        then:
        directBearerAuthClient.getCredentials(*_) >> credentials
        directBearerAuthClient.getUserProfile(*_) >> userProfile
        1 * authService.userDetails() >> null
        result.size() == 3
        result.userName == user.userName
        result.displayName == "abc def"
        result.userId == user.userId

        when: "Authorization header is  not set and authKeyEnabled is false"
        request.removeHeader('Authorization')
        result = service.getCurrentUser()

        then:
        1 * authService.userDetails() >> null
        result == null

        when: "Authorization header is  not set and authKeyEnabled is true"
        grailsApplication.config.mobile.authKeyEnabled = true
        request.removeHeader('Authorization')
        request.addHeader(UserInfoService.AUTH_KEY_HEADER_FIELD, key)
        request.addHeader(UserInfoService.USER_NAME_HEADER_FIELD, userName)
        result = service.getCurrentUser()

        then:
        1 * authService.userDetails() >> null
        1 * webService.doPostWithParams(grailsApplication.config.mobile.auth.check.url, [userName: userName, authKey: key]) >> [ statusCode: 200, resp: [status: "success"]]
        1 * webService.doPostWithParams("${grailsApplication.config.userDetails.url}userDetails/getUserDetails", [userName: userName]) >> [ statusCode: 200, resp: user]
        result.size() == 3
        result.displayName == "first last"
        result.userName == user.userName
        result.userId == user.userId
    }
}

class AuthService {
    def userDetails () {
        [:]
    }
}
