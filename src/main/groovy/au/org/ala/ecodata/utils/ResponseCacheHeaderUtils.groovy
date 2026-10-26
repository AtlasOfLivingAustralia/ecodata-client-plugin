package au.org.ala.ecodata.utils

import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders


class ResponseCacheHeaderUtils {

    static int ONE_DAY_IN_SECONDS = 60*60*24
    static int ONE_WEEK_IN_SECONDS = 60*60*24*7

    /**
     * Sets the cache headers on the response to cache for the specified number of seconds.
     *
     * @param response The response to set the headers on
     * @param maxAge The maximum age in seconds to cache for
     */
    static void applyCacheHeaders(HttpServletResponse response, int maxAge) {
        response.setHeader(HttpHeaders.PRAGMA, '')
        response.setDateHeader(HttpHeaders.EXPIRES, maxAge*1000+System.currentTimeMillis())
        response.setHeader(HttpHeaders.CACHE_CONTROL, 'public, max-age=' + Integer.toString(maxAge))
    }
}
