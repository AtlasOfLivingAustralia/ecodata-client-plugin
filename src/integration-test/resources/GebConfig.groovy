import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.firefox.FirefoxDriver
import org.openqa.selenium.phantomjs.PhantomJSDriver

environments {

    // When developing functional tests, it's convenient to not require the app to be launched
    // when using test-app.  This can be achieved by passing the grails.server.url & grails.server.port
    // grails test-app functional: -Dgeb.env=chrome -Dgrails.server.url=localhost -Dgrails.server.port=8080
    // The browser can be selected by passing geb.env to the runtime.  You need to run npm install before
    // the drivers will be available for use by geb.

println "Cat"
    //baseUrl = 'http://localhost:8080/'

    chrome {
        if (!System.getProperty("webdriver.chrome.driver")) {
            System.setProperty("webdriver.chrome.driver", "node_modules/chromedriver/bin/chromedriver")
        }
        driver = { new ChromeDriver() }
    }

    firefox {
        driver = { new FirefoxDriver() }
    }

    phantomjs {
        if (!System.getProperty("phantomjs.binary.path")) {
            String phantomjsPath = "node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs"
            if (!new File(phantomjsPath).exists()) {
                throw new RuntimeException("Please install node modules before running functional tests")
            }

            System.setProperty("phantomjs.binary.path", phantomjsPath)
        }

        driver = { new PhantomJSDriver() }
    }

    chromeHeadless {
        if (!System.getProperty("webdriver.chrome.driver")) {
            System.setProperty("webdriver.chrome.driver", "node_modules/chromedriver/bin/chromedriver")
        }
        driver = {
            ChromeOptions o = new ChromeOptions()
            o.addArguments('headless')
            o.addArguments("window-size=1920,1080")
            o.addArguments('disable-dev-shm-usage')
            new ChromeDriver(o)
        }
    }

}