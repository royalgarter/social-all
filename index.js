var _UA_MOBILE = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Mobile Safari/537.36';
var _DEFAULT_SETTINGS = {
	'#txt-urls': 'https://www.google.com/,http://www.bing.com/\nhttps://www.facebook.com/'
}

var DOM = function(sel) {
	return document.querySelectorAll(sel);
};

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

	DOM('#footer .tab-header')[0].appendChild(tabhead);
	DOM('#footer .tab-header #tab-header-'+tabIdx)[0].addEventListener("click", function(){
		// console.log('click tabId', tabId);

		var activeTabs = DOM('.wv-tbl.active');
		for (var i = 0; i < activeTabs.length; i++) {
			activeTabs[i].style.display = "none";
			activeTabs[i].className = activeTabs[i].className.replace(" active", "");
		}

		var activeTabHeader = DOM('.tab-header.active');
		for (var i = 0; i < activeTabHeader.length; i++) {
			activeTabHeader[i].className = activeTabHeader[i].className.replace(" active", "");
		}

		DOM('#'+tabId)[0].style.display = "";
		DOM('#'+tabId)[0].className += " active";
		DOM('#'+tabHeadId)[0].className += " active";
	});

	var tab = document.createElement('div');
	tab.setAttribute("id", tabId);
	tab.setAttribute("class", "wv-tbl");
	DOM('body #tabs')[0].appendChild(tab);

	var htmlTabTpl = DOM('#tpl-wv-cell')[0].outerHTML;

	for (var i = 0; i < urls.length; i++) {
		DOM('#'+tabId)[0].innerHTML += htmlTabTpl;
	}

	DOM('#'+tabId+' .wv-cell').forEach(function(cell) {
		var url = urls.shift();

		if (~url.search(/rss\:/i)) {
			var feedUrl = url.replace(/rss\:/i, '');
			console.log('feedUrl', feedUrl)

			$.get(feedUrl, function (data) {
				// console.log('data', data)

				var list = $(data).find("item")

				if (list.length == 0) list = $(data).find("entry");

				// console.log('list', list.length)

				list.each(function(i, val) { 
					var $this = $(this);
					var	item = {
							title: $this.find("title").text(),
							link: $this.find("link").text(),
							description: $this.find("description").text(),
							pubDate: $this.find("pubDate").text(),
							author: $this.find("author").text(),
							guid: $this.find("guid").text()
					};
					item.title = item.title.replace("<![CDATA[", "").replace("]]>", "");

					item.description = item.description.replace(/<img.*\/img>/ig, '');
					item.description = item.description.replace(/<a.*\/a>/ig, '');

					var itemHTML = '<li><a href="' +item.guid +'">' +item.title +'</a>'+item.description+'</li>';

					console.log(itemHTML);

					// $('#'+tabId+' .wv-cell .feed').append($(itemHTML));
					cell.querySelector('.feed').appendChild($(itemHTML)[0]);
				});
			});

			cell.setAttribute('style', '');
			cell.setAttribute('id', '');
			cell.querySelector('.webview-tab').setAttribute('style', 'display:none;');
			cell.querySelector('.controls').setAttribute('style', 'display:none;');
			cell.querySelector('.rss-content').setAttribute('style', '');
		} else {
			var webview = cell.querySelector('webview');

			cell.setAttribute('style', '');
			cell.setAttribute('id', '');
			cell.querySelector('.controls').setAttribute('style', '');
			cell.querySelector('.location').setAttribute('value', url);
			
			webview.setUserAgentOverride(_UA_MOBILE);
			webview.src = url;

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

			var handleLoad = function (event) {
				var url = event.newUrl || event.url;
				if (!event.isTopLevel || !url) return;
				// console.log('url', url, JSON.stringify(event));
				cell.querySelector('.location').value = url;
			}

			webview.addEventListener('loadstart', handleLoad);
			webview.addEventListener('loadstop', handleLoad);
			webview.addEventListener('loadredirect', handleLoad);
		}
	});

	DOM('#'+tabId)[0].style.display = "none";
}

onload = function() {
	DOM('#txt-urls')[0].onchange = function(){
		chrome.storage.sync.set({'#txt-urls': DOM('#txt-urls')[0].value}, function() {
			// console.log('Settings saved');
		});
	};

	chrome.storage.sync.get('#txt-urls', function (obj) {
		if (!obj || !obj['#txt-urls']) {
			obj = _DEFAULT_SETTINGS;
			DOM('#txt-urls')[0].value = obj['#txt-urls'];
			DOM('#txt-urls')[0].onchange();
		}

		DOM('#txt-urls')[0].value = obj['#txt-urls'];
		var tabs = obj['#txt-urls'].trim().split('\n');

		for (var i = 0; i < tabs.length; i++) {
			var urls = tabs[i].trim().split(',');
			init(urls, i);
			// break;
		}

		DOM('#tpl-wv-cell')[0].remove();
		DOM('#tab-header-0')[0].click();

		var wvs = DOM('.webview-tab');
		for (var i = 0; i < wvs.length; i++) {
			wvs[i].addEventListener('newwindow', onNewWindow);
		}

		DOM('#footer #tab-header-setting')[0].addEventListener("click", function(){
			DOM('#footer #txt-urls')[0].style.display = DOM('#footer #txt-urls')[0].style.display == 'none' ? '' : 'none';
		});

		var wvs = DOM('.webview-tab');
		for (var i = 0; i < wvs.length; i++) {
			wvs[i].reload();
		}

	});
}

/*
rss:http://jquery-plugins.net/rss
https://twitter.com/home,https://www.reddit.com/,https://m.facebook.com/
https://tinhte.vn/,https://vnexpress.net/,https://plus.google.com/
https://coinmarketcap.com/,https://coins.live/news/,https://coinmarketed.com/
https://www.tradingview.com/chart/2aMvgAsq/#
*/