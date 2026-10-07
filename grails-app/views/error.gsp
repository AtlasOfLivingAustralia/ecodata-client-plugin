<!DOCTYPE html>
<html>
	<head>
		<title><g:if env="development">Grails Runtime Exception</g:if><g:unless env="development">Error</g:unless></title>
		<meta name="layout" content="main">
		<g:if env="development"><asset:stylesheet src="errors.css"/></g:if>
	</head>
	<body>
		<g:if env="development">
			<g:renderException exception="${exception}" />
		</g:if>
		<g:unless env="development">
			<ul class="errors">
				<li>An error has occurred</li>
			</ul>
		</g:unless>
	</body>
</html>
