# selenium

To make HTTP requests with Axios, we need: \
Copy the call as cURL (bash): \
1. With this information, we can keep the related cookie of the sesion that send the main information about the user's credentials.
2. We need to send the request with HTML structure. We can find it there __--data-raw__:F12 > Network > endpoint > Form Data >

``draw: 1

columns[0][data]: 0 

columns[0][name]:

columns[0][searchable]: true

columns[0][orderable]: true

columns[0][search][value]: 

columns[0][search][regex]: false``

Then into the code, we need to parse this HTML structure 
through querystring.encode(data).

Using Axios, it's necessary to send the same things that the browser sends (if you want to do the same).

It may be anything that can go in a HTTP request. At least we need:
- URL.
- Method (get, post, etc...).

And optionally:
- Headers (where we can find, optionally, the cookies).
- Body (if it's a POST request, the informationit's posibly sent into the body)
- The URL parameters (normally, if it's a GET request). This is usually a part in the URL, after "?".
