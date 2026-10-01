import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.firefox.FirefoxDriver

/**
 * Prefer an explicit -Dwebdriver.chrome.driver (CI supplies one).
 * Otherwise use the native binary shipped by the npm chromedriver package.
 * If neither is available, leave the property unset so Selenium Manager can resolve a driver.
 */
def configureChromeDriverProperty = {
    if (System.getProperty("webdriver.chrome.driver")) {
        return
    }
    File nativeDriver = new File("node_modules/chromedriver/lib/chromedriver/chromedriver")
    if (nativeDriver.exists() && nativeDriver.canExecute()) {
        System.setProperty("webdriver.chrome.driver", nativeDriver.absolutePath)
    }
}

configureChromeDriverProperty()

driver = { new ChromeDriver() }
baseUrl = 'http://localhost:8087/'
atCheckWaiting = true
waiting {
    timeout = 20
    retryInterval = 0.5
}

environments {

    reportsDir = 'build/reports/geb-reports'

    // run as: ./gradlew -Dgeb.env=chrome integrationTest
    chrome {

        driver = {
            ChromeOptions options = new ChromeOptions()
            options.addArguments("--remote-allow-origins=*")
            new ChromeDriver(options)
        }
    }

    firefox {
        driver = { new FirefoxDriver() }
    }

    chromeHeadless {
        configureChromeDriverProperty()
        driver = {
            ChromeOptions o = new ChromeOptions()
            o.addArguments('headless')
            o.addArguments("window-size=1920,1080")
            o.addArguments('--disable-dev-shm-usage')
            o.addArguments("--remote-allow-origins=*")
            new ChromeDriver(o)
        }
    }

}
