(function () { 
 return angular.module("app")
.constant("ServerUrl", "http://localhost:9000")
.constant("IsDebug", true)
.constant("CookieConfig", {"domain":""});

})();
