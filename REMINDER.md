heroku config:set ADMIN_HOST_IP=ip_address
heroku config:set FRONTEND_HOST=frontend_url
heroku ps:scale web=0
heroku ps:scale web=1
