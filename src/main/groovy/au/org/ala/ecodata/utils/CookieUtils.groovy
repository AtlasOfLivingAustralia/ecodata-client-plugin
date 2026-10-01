package au.org.ala.ecodata.utils

import jakarta.servlet.http.Cookie
import org.grails.web.servlet.mvc.GrailsWebRequest

/**
 * Utility class for working with cookies in a Grails application.
 */
class CookieUtils {
    /** Replacement for the discontinued grails-cookie plugin's cookieService.getCookie. */
    static String getCookieValue(String name) {
        GrailsWebRequest webRequest = GrailsWebRequest.lookup()
        webRequest?.currentRequest?.cookies?.find { it.name == name }?.value
    }

    /** Replacement for the discontinued grails-cookie plugin's cookieService.setCookie. */
    static void setCookieValue(String name, String value, Integer maxAge = null, String path = null, String domain = null, Boolean secure = null, Boolean httpOnly = null) {
        GrailsWebRequest webRequest = GrailsWebRequest.lookup()
        if (webRequest?.currentResponse != null && value != null) {
            Cookie cookie = new Cookie(name, value)
            cookie.maxAge = maxAge
            cookie.path = path
            cookie.domain = domain
            cookie.secure = secure ?: true
            cookie.httpOnly = httpOnly ?: true
            webRequest.currentResponse.addCookie(cookie)
        }
    }
}
