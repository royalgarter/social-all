var ua_mobile = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';

var $ = function(sel) {
	return document.querySelectorAll(sel);
};

var init = function (urls, tabIdx) {
	if (!urls) return;

	var tabHeadId = "tab-header-" + tabIdx;
	var tabId = "tab-" + tabIdx;

	var tabhead = document.createElement('button');
	tabhead.setAttribute("id", tabHeadId);
	tabhead.setAttribute("class", "tab-header");
	tabhead.innerHTML = tabId;

	$('#footer .tab-header')[0].appendChild(tabhead);
	$('#footer .tab-header #tab-header-'+tabIdx)[0].addEventListener("click", function(){
		console.log('click tabId', tabId);

		var activeTabs = $('.wv-tbl.active');
		for (var i = 0; i < activeTabs.length; i++) {
			activeTabs[i].style.display = "none";
			activeTabs[i].className = activeTabs[i].className.replace(" active", "");
		}

		$('#'+tabId)[0].style.display = "";
		$('#'+tabId)[0].className += " active";
	});

	var tab = document.createElement('div');
	tab.setAttribute("id", tabId);
	tab.setAttribute("class", "wv-tbl");
	$('body')[0].appendChild(tab);

	var htmlTabTpl = $('#tpl-wv-cell')[0].outerHTML;

	for (var i = 0; i < urls.length; i++) {
		$('#'+tabId)[0].innerHTML += htmlTabTpl;
	}

	$('#'+tabId+' .wv-cell').forEach(function(cell) {
		var url = urls.pop();
		var webview = cell.querySelector('webview');

		cell.setAttribute('style', '');
		cell.setAttribute('id', '');
		cell.querySelector('.controls').setAttribute('style', '');
		cell.querySelector('.location').setAttribute('value', url);
		
		webview.setUserAgentOverride(ua_mobile);
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
// https://mobile.twitter.com/home,https://www.reddit.com/,https://m.facebook.com/,https://www.youtube.com,
onload = function() {
	$('#txt-urls')[0].onchange = function(){
		chrome.storage.sync.set({'#txt-urls': $('#txt-urls')[0].value}, function() {
			// console.log('Settings saved');
		});
	};

	chrome.storage.sync.get('#txt-urls', function (obj) {
        // console.log('#txt-urls', obj['#txt-urls']);
        $('#txt-urls')[0].value = obj['#txt-urls'];
        var tabs = obj['#txt-urls'].trim().split('\n');

        for (var i = 0; i < tabs.length; i++) {
        	var urls = tabs[i].trim().split(',');
       		init(urls, i);
       		// break;
        }

        $('#tpl-wv-cell')[0].remove();
        $('#tab-header-0')[0].click();
    });
}
