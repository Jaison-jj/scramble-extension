Requirement 1

//REQUIREMENT #2
/**
 * If there is no cookie take the user to the site t login
 * if there is no cookie show red icon
 * when cookie is found show green icon
 * when clicked on the green icon call the api with the cookie
 * set the fields with the response
 */

 /**
 The extension can access cookies if the right permissions are set.
the extension should have permission for cookies
the extension should have host_permission of the site (this ensures extension can access cookies for specific domains)
cookies marked with HttpOnly attribute extension and sites wont be able to read it
cookies marked with SameSite=Strict attribute the extension wont be able to read it
cookies marked with Secure attribute will be only accessible via HTTPS, so the extension should be running on a secure connection
If the extension to catch cookies on incognito mode, "incognito": "spanning" permission is need to be set to the extension
 */