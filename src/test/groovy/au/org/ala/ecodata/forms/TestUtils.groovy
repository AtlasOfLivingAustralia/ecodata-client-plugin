package au.org.ala.ecodata.forms

import groovy.xml.XmlUtil

//import org.cyberneko.html.parsers.SAXParser
//import javax.xml.parsers.SAXParser
import javax.xml.parsers.SAXParser

import groovy.util.slurpersupport.NodeChild

import javax.xml.parsers.SAXParserFactory

class TestUtils {

    /**
     * Compares HTML in a whitespace insensitive manner.
     * @param actual the expected HTML
     * @param expected the actual HTML
     */
    static void compareHtml(Writer actual, Writer expected) {
        String actualStr = actual.toString()
        String expectedStr = expected.toString()
        compareHtml(actualStr, expectedStr)
    }

    static void compareHtml(Writer actual, String expected) {
        String actualStr = actual.toString()
        compareHtml(actualStr, expected)
    }


    static void compareHtml(String actual, String expected) {

      //  def saxParser = SAXParserFactory.newInstance().newSAXParser()
        //XmlSlurper x1 = new XmlSlurper(saxParser)]
        XmlSlurper x1 = new XmlSlurper()

        // Wrap both expected and actual in <html></html> so the XML parser doesn't complain if we are expecting a list of nodes
        Iterator actualXml = x1.parse(new StringReader("<html>"+actual+"</html>")).depthFirst()
        Iterator expectedXml = x1.parse(new StringReader("<html>"+expected+"</html>")).depthFirst()


        while (expectedXml.hasNext()) {
            assert actualXml.hasNext()

            NodeChild expectedNode = expectedXml.next()
            NodeChild actualNode = actualXml.next()

            assert expectedNode.name() == actualNode.name()
            assert expectedNode.attributes() == actualNode.attributes()

        }
    }
}