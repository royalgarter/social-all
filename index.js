var _UA_MOBILE = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Mobile Safari/537.36';
var _DEFAULT_SETTINGS = {
	'#txt-urls': 'https://www.google.com/,http://www.bing.com/\nhttps://www.facebook.com/'
}

var $ = function(sel) {
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

	$('#'+tabId+' .wv-cell').forEach(function(cell) {
		var url = urls.shift();
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

		var wvs = $('.webview-tab');
		for (var i = 0; i < wvs.length; i++) {
			wvs[i].reload();
		}

    });
}

/*
https://twitter.com/home,https://www.reddit.com/,https://m.facebook.com/,https://plus.google.com/
https://tinhte.vn/,https://vnexpress.net/
https://coinmarketcap.com/,https://coins.live/news/
*/