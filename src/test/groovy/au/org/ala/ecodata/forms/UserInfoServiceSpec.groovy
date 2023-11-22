package au.org.ala.ecodata.forms

import au.org.ala.web.UserDetails
import au.org.ala.ws.security.client.AlaOidcClient
import au.org.ala.ws.security.profile.AlaOidcUserProfile
import grails.testing.services.ServiceUnitTest
import grails.testing.web.GrailsWebUnitTest
import org.pac4j.core.config.Config
import org.pac4j.core.credentials.AnonymousCredentials
import org.pac4j.core.credentials.Credentials
import org.pac4j.core.profile.UserProfile
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
    AlaOidcClient alaOidcClient
    Config pack4jConfig

    def user
    def userName
    def userDetails
    def key
    def setup() {
        userName = "test@gmail.com"
        key = "abcdefg"
        user = [firstName: "first", lastName: "last", userName: "test@gmail.com", 'userId': "4000"]
        userDetails = new UserDetails(1, user.firstName, user.lastName, user.userName, user.userName, user.userId, false, true, null)
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
        1 * authService.getUserForEmailAddress(userName, true) >> userDetails
        result.firstName == "first"
        result.displayName == "first last"
        result.userId == "4000"

        when:
        result = service.getUserFromAuthKey(userName, key)

        then:
        1 * webService.doPostWithParams(grailsApplication.config.mobile.auth.check.url, [userName: userName, authKey: key]) >> [ statusCode: 404, resp: [status: "error"]]
        0 * authService.getUserForEmailAddress(userName, true)
        result == null
    }

    void "getUserFromJWT returns user when Authorization header is passed"() {
        setup:
        def result
        alaOidcClient = GroovyMock([global: true], AlaOidcClient)
        pack4jConfig =  GroovyMock([global: true], Config)
        service.alaOidcClient = alaOidcClient
        service.config = pack4jConfig
        AlaOidcUserProfile person = new AlaOidcUserProfile(user.userId)
        Optional<Credentials> credentials = new Optional<Credentials>(AnonymousCredentials.INSTANCE)
        Optional<UserProfile> userProfile = new Optional<UserProfile>(person)

        when:
        request.addHeader('Authorization', 'Bearer abcdef')
        result = service.getUserFromJWT()

        then:
        alaOidcClient.getCredentials(*_) >> credentials
        alaOidcClient.getUserProfile(*_) >> userProfile
        authService.getUserForUserId(user.userId)  >> userDetails
        result.userName == user.userName
        result.displayName == "${user.firstName} ${user.lastName}"
        result.userId == user.userId
    }

    void "getCurrentUser should get current user from CAS"() {
        setup:
        def result
        alaOidcClient = GroovyMock([global: true], AlaOidcClient)
        pack4jConfig =  GroovyMock([global: true], Config)
        service.alaOidcClient = alaOidcClient
        service.config = pack4jConfig
        AlaOidcUserProfile person = new AlaOidcUserProfile(user.userId)
        Optional<Credentials> credentials = new Optional<Credentials>(AnonymousCredentials.INSTANCE)
        Optional<UserProfile> userProfile = new Optional<UserProfile>(person)

        when:
        result = service.getCurrentUserFromSupportedMethods()

        then:
        1 * authService.userDetails() >> userDetails
        result.userId == "4000"
        result.displayName == "first last"

        when:
        request.addHeader('Authorization', 'Bearer abcdef')
        result = service.getCurrentUserFromSupportedMethods()

        then:
        alaOidcClient.getCredentials(*_) >> credentials
        alaOidcClient.getUserProfile(*_) >> userProfile
        1 * authService.getUserForUserId(user.userId) >> userDetails
        1 * authService.userDetails() >> null
        result.userName == user.userName
        result.displayName == "first last"
        result.userId == user.userId

        when: "Authorization header is  not set and authKeyEnabled is false"
        request.removeHeader('Authorization')
        result = service.getCurrentUserFromSupportedMethods()

        then:
        1 * authService.userDetails() >> null
        result == null

        when: "Authorization header is  not set and authKeyEnabled is true"
        grailsApplication.config.mobile.authKeyEnabled = true
        request.removeHeader('Authorization')
        request.addHeader(UserInfoService.AUTH_KEY_HEADER_FIELD, key)
        request.addHeader(UserInfoService.USER_NAME_HEADER_FIELD, userName)
        result = service.getCurrentUserFromSupportedMethods()

        then:
        1 * authService.userDetails() >> null
        1 * webService.doPostWithParams(grailsApplication.config.mobile.auth.check.url, [userName: userName, authKey: key]) >> [ statusCode: 200, resp: [status: "success"]]
        1 * authService.getUserForEmailAddress( userName, true) >> userDetails
        result.displayName == "first last"
        result.userName == user.userName
        result.userId == user.userId
    }
}

class AuthService {
    def user = [firstName: "first", lastName: "last", userName: "test@gmail.com", 'userId': "4000"]
    def userDetails () {
        new UserDetails(1, user.firstName, user.lastName, user.userName, user.userName, userId, false, true, null)
    }

    UserDetails getUserForUserId(String userId) {
        new UserDetails(1, user.firstName, user.lastName, user.userName, user.userName, userId, false, true, null)
    }


    UserDetails getUserForEmailAddress(String emailAddress, boolean includeProps = true) {
        new UserDetails(1, user.firstName, user.lastName, user.userName, user.userName, user.userId, false, true, null)
    }
}