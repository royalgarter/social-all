/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		id: 'embedder',
		state: "fullscreen",
	}, function(win) {
		win.contentWindow.onload = function() {
			console.log('win.contentWindow.onload');
			var webviews = win.contentWindow.document.querySelectorAll('webview');
			for (var i = 0; i < webviews.length; i++) {
				webviews[i].addEventListener('newwindow', function(e) {
					console.log('newwindow');
					e.preventDefault();
					chrome.app.window.create(e.targetUrl, {
						state: "fullscreen",
					});
				});
			}
		};
	});
});