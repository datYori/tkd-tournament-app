heroku config:set FRONTEND_HOST=frontend_url
heroku config:set AUTH_TOKEN=auth_token
heroku ps:scale web=0
heroku ps:scale web=1
