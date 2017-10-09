var _UA_MOBILE = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Mobile Safari/537.36';
var _DEFAULT_SETTINGS = {
	'#txt-urls': 'https://www.google.com/,http://www.bing.com/\nhttps://www.facebook.com/'
}

var onNewWindow = function (event) {
	// console.log("onNewWindow:", event.windowOpenDisposition);

	switch (event.windowOpenDisposition) {
		case 'ignore':
			// Not sure what this is used by.  Default enum value, maybe.
			console.log('event.windowOpenDisposition=ignore');
		return;

		case 'save_to_disk':
			// Ctrl + S, maybe?  Not sure how to reproduce that.
			console.log('event.windowOpenDisposition=save_to_disk');
		return;

		case 'current_tab':
			console.log("event.windowOpenDisposition=current_tab");
		return;

		case 'new_background_tab':
		case 'new_foreground_tab':
			newWindow = open(event.targetUrl, '_blank');
			if (event.windowOpenDisposition != 'new_background_tab') {
				newWindow.focus();
			}
		break;

		case 'new_window':
		case 'new_popup':
			newWindow = open(event.targetUrl, '_blank');
			newWindow.focus();
		break;
	}
}

var init = function (urls, tabIdx) {
	if (!urls) return;

	var tabHeadId = "tab-header-" + tabIdx;
	var tabId = "tab-" + tabIdx;

	var tabhead = document.createElement('button');
	tabhead.setAttribute("id", tabHeadId);
	tabhead.setAttribute("class", "tab-header");
	tabhead.innerHTML = "View " + (tabIdx+1);

	$('#footer .tab-header')[0].appendChild(tabhead);
	$('#footer .tab-header #tab-header-'+tabIdx)[0].addEventListener("click", function(){
		// console.log('click tabId', tabId);

		var activeTabs = $('.wv-tbl.active');
		for (var i = 0; i < activeTabs.length; i++) {
			activeTabs[i].style.display = "none";
			activeTabs[i].className = activeTabs[i].className.replace(" active", "");
		}

		var activeTabHeader = $('.tab-header.active');
		for (var i = 0; i < activeTabHeader.length; i++) {
			activeTabHeader[i].className = activeTabHeader[i].className.replace(" active", "");
		}

		$('#'+tabId)[0].style.display = "";
		$('#'+tabId)[0].className += " active";
		$('#'+tabHeadId)[0].className += " active";
	});

	var tab = document.createElement('div');
	tab.setAttribute("id", tabId);
	tab.setAttribute("class", "wv-tbl");
	$('body #tabs')[0].appendChild(tab);

	var htmlTabTpl = $('#tpl-wv-cell')[0].outerHTML;

	for (var i = 0; i < urls.length; i++) {
		$('#'+tabId)[0].innerHTML += htmlTabTpl;
	}

	$('#'+tabId+' .wv-cell').toArray().forEach(function(cell) {
		var url = urls.shift();

		cell.setAttribute('style', '');
		cell.setAttribute('id', '');

		if (~url.search(/rss\:/i)) {
			var feedUrl = url.replace(/rss\:/i, '');
			// console.log('feedUrl', feedUrl)

			$.get(feedUrl, function (data) {
				// console.log('data', data)

				var list = $(data).find("item")

				if (list.length == 0) list = $(data).find("entry");

				list.each(function(i, val) { 
					var me = $(this);
					var	item = {
						title: me.find("title").text(),
						link: me.find("link").text() || me.find("link").attr('href'),
						desc: me.find("description").text() || me.find("content").text(),
						time: me.find("pubDate").text() || me.find("updated").text(),
						author: me.find("author name").text() || me.find("author").text(),
						guid: me.find("guid").text() ||  me.find("id").text()
					};
					// console.log(item.desc)
					item.title = item.title.replace("<![CDATA[", "").replace("]]>", "");
					// item.desc = item.desc.replace(/<img[^>]*>/ig, '');
					// item.desc = item.desc.replace(/<a[^>]*>/ig, '');

					var desc = document.createElement('div');
					desc.innerHTML = item.desc;
					var imgs = desc.querySelectorAll('img');

					var done = function () {
						var itemHTML = '<li><a class="rss-head" href="' +item.link +'">' +item.title +'</a><i>&#10004;</i><br>'+desc.innerHTML+'</li>';
						cell.querySelector('.feed').appendChild($(itemHTML)[0]);
						cell.querySelectorAll('a').forEach(function(a) {
							a.setAttribute('target', '_blank');
						});

						cell.querySelectorAll('.feed i').forEach(function(icon) {
							var href = icon.parentNode.querySelector('a').getAttribute('href');

							icon.onclick = function() {
								var obj = {};obj[href] = new Date();
								chrome.storage.local.set(obj, function () {});
								icon.parentNode.setAttribute('style', 'display:none;');
							};

							chrome.storage.local.get(href, function (obj) {
								if (!obj || !obj[href]) return;

								icon.onclick();
							});
						});
					}

					var count = 0;
					imgs.length == 0 ? done () : imgs.forEach(function (img) {
						var xhr = new XMLHttpRequest();
						xhr.responseType = 'blob';
						xhr.onload = function() {
							count++;
							img.src = window.URL.createObjectURL(xhr.response);

							img.setAttribute('class', (img.getAttribute('class') || '') + ' rss-item-img');

							if (count == imgs.length) done()
						}
						xhr.open('GET', img.getAttribute('src'), true);
						xhr.send();
					});
				});

				cell.querySelector('.rss-content').insertBefore($('<div class="rss-title"><a href="'+feedUrl+'">'+feedUrl+'</a></div>')[0], cell.querySelector('ul'));
			});

			
			cell.querySelector('.webview-tab').setAttribute('style', 'display:none;');
			cell.querySelector('.controls').setAttribute('style', 'display:none;');
			cell.querySelector('.rss-content').setAttribute('style', '');
		} else {
			var webview = cell.querySelector('webview');

			var handleLoad = function (event) {
				var url = event.newUrl || event.url;
				if (!event.isTopLevel || !url) return;
				// console.log('url', url, JSON.stringify(event));
				cell.querySelector('.location').value = url;
			}
			
			webview.setUserAgentOverride(_UA_MOBILE);
			webview.src = url;
			webview.addEventListener('loadstart', handleLoad);
			webview.addEventListener('loadstop', handleLoad);
			webview.addEventListener('loadredirect', handleLoad);

			cell.querySelector('.btn-back').onclick = function() {
				webview.back();
			};

			cell.querySelector('.btn-forward').onclick = function() {
				webview.forward();
			};

			cell.querySelector('.btn-home').onclick = function() {
				webview.focus();
				webview.src = url;
			};

			cell.querySelector('.btn-reload').onclick = function() {
				webview.stop();
				webview.reload();
			};

			cell.querySelector('.form-location').onsubmit = function(e) {
				e.preventDefault();
				webview.focus();
				webview.src = cell.querySelector('.location').value;
			};

			cell.querySelector('.controls').setAttribute('style', '');
			cell.querySelector('.location').setAttribute('value', url);
		}
	});

	$('#'+tabId)[0].style.display = "none";
}

onload = function() {
	$('#txt-urls')[0].onchange = function(){
		chrome.storage.sync.set({'#txt-urls': $('#txt-urls')[0].value}, function() {
			// console.log('Settings saved');
		});
	};

	chrome.storage.sync.get('#txt-urls', function (obj) {
		if (!obj || !obj['#txt-urls']) {
			obj = _DEFAULT_SETTINGS;
			$('#txt-urls')[0].value = obj['#txt-urls'];
			$('#txt-urls')[0].onchange();
		}

		$('#txt-urls')[0].value = obj['#txt-urls'];
		var tabs = obj['#txt-urls'].trim().split('\n');

		for (var i = 0; i < tabs.length; i++) {
			var urls = tabs[i].trim().split(',');
			init(urls, i);
			// break;
		}

		$('#tpl-wv-cell')[0].remove();
		$('#tab-header-0')[0].click();

		var wvs = $('.webview-tab');
		for (var i = 0; i < wvs.length; i++) {
			wvs[i].addEventListener('newwindow', onNewWindow);
		}

		$('#footer #tab-header-setting')[0].addEventListener("click", function(){
			$('#footer #txt-urls')[0].style.display = $('#footer #txt-urls')[0].style.display == 'none' ? '' : 'none';
		});

		$('#footer #tab-header-reload')[0].addEventListener("click", function(){
			chrome.runtime.reload();
		});
	});
}

/*
rss:http://jquery-plugins.net/rss
https://twitter.com/home,https://www.reddit.com/,https://m.facebook.com/
https://tinhte.vn/,https://vnexpress.net/,https://plus.google.com/
https://coinmarketcap.com/,https://coins.live/news/,https://coinmarketed.com/
*/