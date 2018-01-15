import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._openSocket();
  this._registerServiceWorker();
}

IndexController.prototype._registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  var indexController = this;

  navigator.serviceWorker.register('/sw.js').then(function(registration) {
    // TODO: if there's no controller, this page wasn't loaded
    // via a service worker, so they're looking at the latest version.
    // In that case, exit early
    if(!navigator.serviceWorker.controller){
      return;
    }
    
    
       if (registration.waiting) {
        //there's an update ready and waiting notify user
        
        indexController._updateReady(registration.waiting);
        return;
       }
       if (registration.installing) {
        //if there's a service worker installing, we want to track
        //it's state changes, then notify user when it's ready
         indexController._trackInstalling(registration.installing);
         return;
       } 
         
      
       //if there isn't an installing worker, listen for updates
       //if there is track it's installation process and notify user
     
      registration.addEventListener("updatefound", function(){
        indexController._trackInstalling(registration.installing);
      });

      navigator.serviceWorker.addEventListener('controllerchange', function(){
        console.log("about to reload");
        window.location.reload();

      });
     

  })
  
};

IndexController.prototype._updateReady = function(worker) {
  var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return;
    // TODO: tell the service worker to skipWaiting
    console.log("message from page: ");
    worker.postMessage("skipWaiting");
  });
};


// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);
  this._postsView.addPosts(messages);
};

IndexController.prototype._trackInstalling = function(worker){
  var indexController = this;
  //add listener to worker to check for state change. when it's
  //installed go ahead and notify user
  worker.addEventListener('statechange', function(){
    if(worker.state == 'installed'){
      indexController._updateReady(worker);
    }
  });
}