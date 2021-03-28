// FILL IN THE FOLLOWING BLOCK WITH YOUR INFORMATION
var mySchoologyDisplayName = ""; // Your display name (as shown above Schoology posts)
var schoologyUsername = ""; // Your Schoology username
var schoologyPassword = ""; // Your Schoology password
var excludedTeacherDisplayNames = []; // An array of the display names of teachers whose posts should be liked after a delay
var excludedTeacherDisplayTime = ; // The delay, in milliseconds, that the Schoology like bot should wait until liking excluded teachers' posts

// Various escaping of special characters that must be done to sanitize inputs to the program
mySchoologyDisplayName = escapeRegExp(mySchoologyDisplayName);
schoologyUsername = encodeURIComponent(schoologyUsername);
schoologyPassword = encodeURIComponent(schoologyPassword);

// Opens Schoology, looks for unliked posts, and likes them
function like() {
  // FIRST HTTP REQUEST: SCHOOLOGY LOGIN PAGE
  // Headers for the first request
  var headersLoginPage = {
    'Connection' : 'keep-alive',
    'Upgrade-Insecure-Requests' : '1',
    'Sec-Fetch-User' : '?1',
    'accept' : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
    'sec-fetch-site' : 'none',
    'sec-fetch-mode' : 'navigate',
    'accept-encoding' : 'gzip, deflate, br',
    'accept-language' : 'en-US, en; q=0.9'
  };
  
  // Options for the first request
  var optionsLoginPage = {
    'method':'get',
    'headers': headersLoginPage
  };
  
  // Gets the login page and the form_build_id for the login form (necessary to login)
  var loginPage = UrlFetchApp.fetch("https://app.schoology.com/login", optionsLoginPage);
  var quoteDelimiterRegExp = RegExp("['\"]", "g")
  var loginFormCodeRegExp = RegExp("name\\s*=\\s*[\"']form_build_id\\s*['\"]\\s*id\s*=\\s*[\"'][\\w-]*['\"]", "g");
  var loginFormCode = loginPage.getContentText().match(loginFormCodeRegExp)[0].split(quoteDelimiterRegExp)[3];
  
  // SECOND HTTP REQUEST: LOGGING IN TO SCHOOLOGY
  // Payload containing login information
  var payloadLogin = `mail=${schoologyUsername}&pass=${schoologyPassword}&school=&school_nid=&form_build_id=${loginFormCode}&form_id=s_user_login_form`;
  
  // Headers for the second http request
  var headersLogin = {
    'connection' : 'keep-alive',
    'cache-control' : 'max-age=0',
    'origin' : 'https://app.schoology.com',
    'upgrade-insecure-requests' : '1',
    'user-agent' : 'Google Script Fetch App',
    'sec-fetch-user' : '?1',
    'accept' : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
    'sec-fetch-site' : 'same-origin',
    'sec-fetch-mode' : 'navigate',
    'referer' : 'https://app.schoology.com/login',
    'accept-encoding' : 'gzip, deflate, br',
    'accept-language' : 'en-US, en; q=0.9',
    'cookie' : 'has_js=1',
  };
  
  // Providing the length of the payload 
  headersLogin["contentLength"] = byteLength(payloadLogin);
  
  // Options for the second request
  var optionsLogin = {
    'method': 'post',
    'headers' : headersLogin,
    'payload' : payloadLogin,
    'followRedirects' : false
  };
  
  // Logs in to Schoology
  var loginPost = UrlFetchApp.fetch("https://app.schoology.com/login", optionsLogin);
  // Gets a cookie that authenticates requests for this user session
  var cookie = loginPost.getAllHeaders()["Set-Cookie"].split(";")[0]
  
  
  // THIRD HTTP REQUEST: Get the Schoology home page (for the sole sake of getting a CSRF token)
  var homeUrl = "https://app.schoology.com/home";
  var homePage = UrlFetchApp.fetch(homeUrl, {'headers' : {"Cookie": cookie}});
  var tokenRegExp = RegExp("['\"]csrf_token['\"]\\s*:\\s*['\"][\\w-]*['\"]", "g");
  var keyRegExp = RegExp("['\"]csrf_key['\"]\\s*:\\s*['\"][\\w-]*['\"]", "g");
  // The CSRF token and key, as extracted from the Schoology page
  var xcsrfToken = homePage.getContentText().match(tokenRegExp)[0].split(quoteDelimiterRegExp)[3];
  var xcsrfKey = homePage.getContentText().match(keyRegExp)[0].split(quoteDelimiterRegExp)[3];

  // FOURTH HTTP REQUEST: Get posts from the Schoology feed
  var postUrl = "https://app.schoology.com/home/feed?page=0";
  var postPage = UrlFetchApp.fetch(postUrl, {'headers' : {"Cookie": cookie}});
  // Splits the page content by individual posts
  var posts = postPage.getContentText().split("s-edge-type-update-post");
  var i = 1; // Takes the first post (index 0 is gobbledygook)

  // To ensure that you do not unlike a post you have already liked or like your own post
  var isAlreadyLikedRegExp = RegExp("(You like this)|(Liked by You and)", "g");
  var selfPostRegExp = RegExp("View user profile\\.\\\\u0022\\\\u003E" + mySchoologyDisplayName,"g");
  if (posts[i].match(isAlreadyLikedRegExp) != null || posts[i].match(selfPostRegExp) != null){
    return;
  }
  // Testing to see whether the first post in the feed was made by one of the excluded teachers.
  if (excludedTeacherDisplayNames != null && excludedTeacherDisplayNames.length != 0) {
    for (var t = 0; t < excludedTeacherDisplayNames.length; t++) {
      excludedTeacherDisplayNames[t] = "(View user profile\\.\\\\u0022\\\\u003E" + escapeRegExp(excludedTeacherDisplayNames[t]) + ")";
    }
    var excludedTeacherRegExp = RegExp(excludedTeacherDisplayNames.join("|"), "g");
    // If an excluded teacher did make the post, the program will sleep for the prescribed amount of time 
    if (posts[i].match(excludedTeacherRegExp) != null) {
      Utilities.sleep(excludedTeacherDisplayTime);
      var postPage = UrlFetchApp.fetch(postUrl, {'headers' : {"Cookie": cookie}});
      var posts = postPage.getContentText().split("s-edge-type-update-post");
    }
  }

  // FINAL HTTP REQUEST: LIKING THE POST
  // Headers for the third request
  var headersLike = {
    'Connection': 'keep-alive',
    'contentLength': 0,
    'X-NewRelic-ID': 'Vw8OWVNACwUCXVdQ',
    'Origin': 'https://app.schoology.com',
    'X-Csrf-Key': '?',
    'X-Csrf-Token': '?',
    'User-Agent': 'Google Script Fetch App',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Referer': 'https://app.schoology.com/home',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie' : cookie
  };

  // Options for the third request
  var optionsLike = {
    'method' : 'POST',
    'headers' : headersLike,
    "contentType" : "application/xml; charset=utf-8",
    'followRedirects': true
  };

  // The CSRF key is necessary because we are posting a request to Schoology
  headersLike['X-Csrf-Key'] = xcsrfKey;
  headersLike['X-Csrf-Token'] = xcsrfToken;
  
  if (posts[i].match(isAlreadyLikedRegExp) == null && posts[i].match(selfPostRegExp) == null){
    var likeLinkRegExp = RegExp("like-n-\\d*","g");
    var likeString = posts[i].match(likeLinkRegExp)[0].replace(RegExp("\\-", "g"),"/");
    var likeLinkUrl = "https://app.schoology.com/" + likeString;
    UrlFetchApp.fetch(likeLinkUrl, optionsLike);
  }
}

// Returns the byte length of a UTF-8 String
function byteLength(str) {
  var s = str.length;
  for (var i=str.length-1; i>=0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s+=2;
    if (code >= 0xDC00 && code <= 0xDFFF) i--; 
  }
  return s;
}

// Escapes special characters in strings for use in regular expressions. Courtesy of MDN (This code is too short and simple to receive intellectual property protection)
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
