
var staticCache = "wittr-static-v5"

self.addEventListener('install', function(event) {
	// installs our cache for the service worker to fetch later
	/* Change the theme of the site and create a new version
		of the cache to wittr-static-v2
	*/
  var urlsToCache = [
    '/skeleton',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
  ];

  event.waitUntil( 
    // TODO: open a cache named 'wittr-static-v1'
    // Add cache the urls from urlsToCache
    caches.open(staticCache).then(function(cache){
    	cache.addAll(urlsToCache);
    }).catch(function(){
    	console.log("the install failed...");
    })
  );
});
//
self.addEventListener('fetch', function(event) {
	//grab the request url, then serve the skeleton
	//template for faster loading. This will allow us
	//to serve atleast the template for the page if we
	//go offline!
	var requestUrl = new URL(event.request.url);

	if(requestUrl.origin === location.origin){
		if(requestUrl.pathname === '/'){
			event.respondWith(caches.match('/skeleton'));
			return;
		}
	}
 
  //now serve a response from the cache if asked for otherwise go to the network
  event.respondWith(
  	//open the cache object
  	caches.open(staticCache).then(function(cache){
  		return cache.match(event.request).then(function(response){
  			
  			if(response){
  				if(response.url == "http://localhost:8888/"){
  					response.url = "http://localhost:8888/skeleton";
  					return response;
  				}
  				return response;
  				}
  				
  			
  			//no match found give response from network
  		return fetch(event.request).then(function(response){
  			if(response){
  				//response found from network
  				return response;
  			}
  		})
  		}).catch(function(){
  			console.log("fetch event request failed")
  		})
  	}).catch(function(){
  		console.log("cache open failed");

  	})//no ; here :)
  	);
});

/*need to activate  the new service worker with a new cache to
	make any changes we make active when users refresh the page.
	git rid of old caches here since the first service worker gets
	deactivated. use event.waitUntil here to signal the process so while you're
	waiting the browser will cue other events like fetch. caches.delete and caches.keys
*/

self.addEventListener('activate', function(event){
	//delete old caches here
	//get old cache first
	var cacheWhiteList = ['wittr-static-v2'];
	//cha
	event.waitUntil(
		caches.keys().then(function(keylist){
				//Promise.all waits for all of the promises
				//to be returned successfully from the map function
				//to delete the caches.

				Promise.all(
					//only interested in our cachenames
					//beginning with wittr-
					keylist.filter(function(key){
						
						return key.search(/wittr-/g) !== -1 && 
						key != staticCache;
					}).map(function(key){
						console.log("deleted key: " + key)
						return caches.delete(key);
						
					})
				);


				
				
			})
		);

});
//sadfdsfgkdh
self.addEventListener('message', function(event){
	console.log(event.data);
	if(event.data === "skipWaiting"){
		//i've been sent a message to update myself instantly!
		self.skipWaiting();
	}
})