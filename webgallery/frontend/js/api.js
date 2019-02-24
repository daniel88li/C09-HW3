/*jshint esversion: 6 */
var api = (function(){
    "use strict";
    var module = {};
    
    var currImage = null;
    function sendFiles(method, url, data, callback){
        let formdata = new FormData();
        Object.keys(data).forEach(function(key){
            let value = data[key];
            formdata.append(key, value);
        });
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id 
            - (String) title
            - (String) author
            - (Date) date
    
        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date
    
    ****************************** */ 
    
    let userListeners = [];

    let getUsername = function(){
        return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    };

    function notifyUserListeners(username){
        userListeners.forEach(function(listener){
            listener(username);
        });
    }
    
    module.onUserUpdate = function(listener){
        userListeners.push(listener);
        listener(getUsername());
    };
   
    let galleryListeners = [];
    module.onGalleryChange = function(listener) {
        galleryListeners.push(listener);
        notifyGalleryListeners();
    };

    function notifyGalleryListeners(){
        send("GET", "/api/galleryList/", null, function(err, res){
            if (err) return notifyErrorListeners(err);
            galleryListeners.forEach(function(listener){
                listener(res);
            });
        });
    }

    module.signup = function(username, password){
        send("POST", "/signup/", {username, password}, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyUserListeners(getUsername());
        });
    };
    
    module.signin = function(username, password){
        send("POST", "/signin/", {username, password}, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyUserListeners(getUsername());
            notifyGalleryListeners();
        });
    };
    
    module.signout = function(){
        send("GET", "/signout/", null, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyUserListeners(getUsername());
            notifyHideListeners(' ');
        });
    };
    
    // add an image to the gallery
    module.addImage = function(title, file){
        sendFiles("POST", "/api/images/", {title: title, picture: file}, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyImageListeners(res);
            notifyHideListeners(res.author);
            notifyGalleryListeners();
        });
    };
    
    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId){
        send("DELETE", "/api/image/" + imageId + "/", null, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyImageListeners(res);
            notifyHideListeners(getUsername());
            notifyGalleryListeners();
        });
    };
    
    // add a comment to an image
    module.addComment = function(imageId, content){
        send("POST", "/api/comments/", {imageId: imageId, content: content}, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyCommentListeners(imageId, 0);
        });
    };
    
    // delete a comment to an image
    module.deleteComment = function(imageId, commentId){
        send("DELETE", "/api/comments/" + commentId + "/", null, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyCommentListeners(imageId, 0);
        });
    };
    
    module.changeImage = function(username, page){
        getImage(username, page, function(err, images){
            if (err) return notifyErrorListeners(err);
            notifyImageListeners(images[0]);
            notifyHideListeners(images[0].author);
        });
    };

    module.changePage = function(imageId, page){
        notifyCommentListeners(imageId, page);
    };

    // module.getMaxImagePage = function() {
    //     send("GET", "/api/AllImages/", null, function(err, images){
    //         if (err) return notifyErrorListeners(err);
    //         console.log(images.length);
    //         return images.length - 1;
    //     });
    // };

    let getImage = function(username, page, callback){
        send("GET", "/api/image/" + username + "/?page=" + page, null, callback);
    };
    
    let getComments = function(imageId, page, callback){
        send("GET", "/api/comments/" + imageId + "/?page=" + page, null, callback);
    };

    let getFirstImage = function(username, callback){
        send("GET", "/api/" + username + "/firstImage/", null, callback);
    };

    let imageListeners = [];
    
    function notifyImageListeners(image){
        //currImage = image;
        imageListeners.forEach(function(listener){
            listener(image);
            if (image) {
                notifyCommentListeners(image._id, 0);
            }
        });
    }

    // register an image listener
    // to be notified when an image is added or deleted from the gallery
    module.onImageUpdate = function(listener){
        imageListeners.push(listener);
        // getFirstImage(function(err, image){
        //     if (err) return notifyErrorListeners(err);
        //     currImage = image[0];
        //     listener(image[0]);
        // });
    };
    
    let commentListeners = [];
    
    function notifyCommentListeners(imageId, page=0){
        getComments(imageId, page, function(err, comments){
            if (err) return notifyErrorListeners(err);
            commentListeners.forEach(function(listener){
                listener(comments);
            });
        });
    }

    // register an comment listener
    // to be notified when a comment is added or deleted to an image
    module.onCommentUpdate = function(listener){
        commentListeners.push(listener);
        // getFirstImage(function(err, image){
        //     if (image[0]) {
        //         getComments(image[0]._id, 0, function(err, comments){
        //             if (err) return notifyErrorListeners(err);
        //             listener(comments);
        //         });
        //     }
        // });
    };
    
    let hideListeners = [];
    module.onHideCheck = function(listener){
        let username = getUsername();
        hideListeners.push(listener);
        // getFirstImage(username, function(err, image){
        //     if (err) return notifyErrorListeners(err);
        //     listener(username, image);
        // });
    };

    function notifyHideListeners(username){
        hideListeners.forEach(function(listener){
            getFirstImage(username, function(err, image){
                if (err) return notifyErrorListeners(err);
                listener(username, image);
            });
        });
    }

    let errorListeners = [];
    
    function notifyErrorListeners(err){
        errorListeners.forEach(function(listener){
            listener(err);
        });
    }
    
    module.onError = function(listener){
        errorListeners.push(listener);
    };
    return module;
})();