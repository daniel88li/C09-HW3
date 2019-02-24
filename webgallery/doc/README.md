# The Web Gallery REST API Documentation

## User API

### Create

- description: User sign up
- request: `POST /signup/`
    - content-type: `application/json`
    - body: object
        - username: (string) user's username
        - password: (string) user's password
- response: 200
    - content-type: `application/json`
    - body: user username signed up
- response: 409
    - body: username already exist
- response: 500
    - body: db error

``` 
$ curl -H "Content-Type: application/json" -X POST -d '{"username":"Dan","password":"123"}' -c cookie.txt localhost:3000/signup/
```

- description: User sign in
- request: `POST /signin/`
    - content-type: `application/json`
    - body: object
        - username: (string) user's username
        - password: (string) user's password
- response: 200
    - content-type: `application/json`
    - body: user username signed in
- response: 401
    - body: user does not exist, access denied
- response: 500
    - body: db error

``` 
$ curl -H "Content-Type: application/json" -X POST -d '{"username":"Dan","password":"123"}' -c cookie.txt localhost:3000/signin/
```

### Read
- description: User sign out
- request: `GET /signout/`
- response: 200
    - body: user signed out

``` 
$ curl -b cookie.txt -c cookie.txt localhost:3000/signout/
```

- description: Retrieve user list
- request: `GET /api/galleryList/`
- response: 200
    - content-type: `application/json`
    - body: object list of string usernames
- response: 500
    - body: db error

``` 
$ curl localhost:3000/api/galleryList/
```

## Image API

### Create

- description: add a new image
- request: `POST /api/images/`
    - content-type: `multipart/form-data`
    - body: object
        - title: (string) the title of the image
        - picture: (string) path to image file
- response: 200
    - content-type: `application/json`
    - body: object
        - _id: (string) the image id
        - title: (string) the title of the image
        - author: (string) the authors name
        - file: (string) the image file
        - createAt: (string) date the image was added
        - updatedAt: (string) date the image was updated
- response: 500
    - body: db error

``` 
$ curl -X POST -H "Content-Type: multipart/form-data" -F "picture=@C:\Users\Daniel\Desktop\C09\hw2-daniel88li\webgallery\static\media\droplet.jpg" -F "title=Droplet" localhost:3000/api/images/
```

### Read

- description: retrieve the image at page n for given username
- request: `GET /api/image/:username/?page=`
- response: 200
    - content-type: `application/json`
    - body: list of single object
        - _id: (string) the image id
        - title: (string) the title of the image
        - author: (string) the authors name
        - file: (string) the image file
        - createAt: (string) date the image was added
        - updatedAt: (string) date the image was updated
- response: 404
    - body: image page n or username does not exist
- response: 500
    - body: db error
 
``` 
$ curl localhost:3000/api/image/Dan/?page=2
``` 

- description: retrieve the first image for given username
- request: `GET /api/:username/firstImage/`
- response: 200
    - content-type: `application/json`
    - body: list of single object
        - _id: (string) the image id
        - title: (string) the title of the image
        - author: (string) the authors name
        - file: (string) the image file
        - createAt: (string) date the image was added
        - updatedAt: (string) date the image was updated
- response: 500
    - body: db error
 
``` 
$ curl localhost:3000/api/Dan/firstImage/
``` 

- description: retrieve image
- request: `GET /api/images/:id/picture/`
- response: 200
    - content-type: `image/*`
- response: 404
    - body: image id does not exist
- response: 500
    - body: db error

``` 
$ curl localhost:3000/api/images/xjRNjyunQPwt1kSN/picture/
``` 
  
### Delete
  
- description: delete an image
- request: `DELETE /api/image/:id/`
- response: 200
    - content-type: `application/json`
    - body: object or null
        - _id: (string) the image id
        - title: (string) the title of the image
        - author: (string) the authors name
        - file: (string) the image file
        - createAt: (string) date the image was added
        - updatedAt: (string) date the image was updated
- response: 401
    - body: Delete image acecss denied
- response: 404
    - body: image id does not exist
- response: 500
    - body: db error

``` 
$ curl -X DELETE localhost:3000/api/image/zQx8OcvdP9wZDeFX/
``` 

## Comment API

### Create

- description: add a new comment to current image
- request: `POST /api/comments/`
    - content-type: `application/json`
    - body: object
        - imageId: (string) the image id
        - content: (string) the comment
- response: 200
    - content-type: `application/json`
    - body: object
        - _id: (string) the comment id
        - imageId: (string) the image id
        - author: (string) the author of the comment
        - content: (string) the comment
        - createAt: (string) date the comment was added
        - updatedAt: (string) date the comment was updated
- response: 500
    - body: db error

``` 
$ curl -X POST -H "Content-Type: application/json" -d '{"imageId": "xjRNjyunQPwt1kSN", "content": "test"}' localhost:3000/api/comments/
```

### Read

- description: retrieve list of comments
- request: `GET /api/comments/:imageId/?page=`
- response: 200
    - content-type: `application/json`
    - body: list of comment objects
        - _id: (string) the comment id
        - imageId: (string) the image id
        - author: (string) the author of the comment
        - content: (string) the comment
        - createAt: (string) date the comment was added
        - updatedAt: (string) date the comment was updated
- response: 404
    - body: image id does not exist
- response: 500
    - body: db error

``` 
$ curl localhost:3000/api/comments/xjRNjyunQPwt1kSN/?page=0
``` 
  
### Delete
  
- description: delete a comment
- request: `DELETE /api/comments/:id/`
- response: 200
    - content-type: `application/json`
    - body: object
        - _id: (string) the comment id
        - imageId: (string) the image id
        - author: (string) the author of the comment
        - content: (string) the comment
        - createAt: (string) date the comment was added
        - updatedAt: (string) date the comment was updated
- response: 401
    - body: Delete comment access denied
- response: 404
    - body: comment id does not exist
- response: 500
    - body: db error

``` 
$ curl -X DELETE localhost:3000/api/comments/JumwC26N6l26R9Cq/
``` 