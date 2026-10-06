<!DOCTYPE html>
<html>
	<head>
		<title><g:development>Grails Runtime Exception</g:development><g:production>Error</g:production></title>
		<meta name="layout" content="main">
		<g:development><asset:stylesheet src="errors.css"/></g:development>
	</head>
	<body>
		<g:development>
			<g:renderException exception="${exception}" />
		</g:development>
		<g:production>
			<ul class="errors">
				<li>An error has occurred</li>
			</ul>
		</g:production>
	</body>
</html>
